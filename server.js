const from = require('from')
const streamToArray = require('stream-to-array')
const eos = require('end-of-stream')
const async = require('async')
const express = require('express')
const request = require('request')
const cors = require('cors')
const quickMulti = require('quick-multilevel')
const levelup = require('levelup')
const memdown = require('memdown')
const hrtime = require('browser-process-hrtime')
const prettyHrtime = require('pretty-hrtime')
const HtmlTransform = require('./index.js').HtmlTransform
const JsTransform = require('./index.js').JsTransform
const CssTransform = require('./index.js').CssTransform
const generateEnvironment = require('./index.js').generateEnvironment
const PORT = process.env.PORT || 9000
const CACHE_DB = process.env.CACHE_DB

var envOpts = {}

async.waterfall([
  generateEnvironment.bind(null, envOpts),
  startServer,
], function(err){
  if (err) throw err
  console.log('Dapp transform listening on', PORT)
})


function startServer(environment, cb){
  var app = express()
  app.use(cors())

  var cacheDb = createCacheDb()

  // transform html
  app.get('/html/:target', function(req, res) {
    var targetUrl = req.params.target
    var skipInit = !req.query.init
    var transform = HtmlTransform({
      targetUrl: targetUrl,
      environment: environment,
    })
    performTransform('html', targetUrl, cacheDb, transform, res)
  })

  // transform js
  app.get('/js/:target', function(req, res) {
    var targetUrl = req.params.target
    var transform = JsTransform({
      targetUrl: targetUrl,
      environment: environment,
    })
    performTransform('js', targetUrl, cacheDb, transform, res)
  })

  // transform css
  app.get('/css/:target', function(req, res) {
    var targetUrl = req.params.target
    var transform = CssTransform({
      targetUrl: targetUrl,
      environment: environment,
    })
    performTransform('css', targetUrl, cacheDb, transform, res)
  })

  // static assets
  app.get('/static/init.js', function(req, res) {
    res.send(environment.init)
  })

  app.listen(PORT, cb)
}

// request target, perform tranform, respond
// handles errors during this process
function performTransform(label, url, cacheDb, transformStream, res){
  console.log('transforming '+label+' => ' + url)
  var startTime = hrtime()
  var didAbort = false
  var req = null
  var cached = null

  tryCache(initiateTransform)

  function tryCache(cb){
    cacheDb.get(url, cb)
  }

  function initiateTransform(_, cached){
    // ignore err - means db read miss

    // get request
    try {
      if (cached) {
        console.log('CACHE HIT =>', url)
        req = from([cached])
        req.on('error', onError)
      } else {
        console.log('CACHE MISS =>', url)
        req = request({ url: url })
        req.on('error', onError)
        req = req.pipe(transformStream)
        req.on('error', onError)
        streamToArray(req, writeToCache)
      }
    } catch (err) {
      return onError(err)
    }

    eos(req, onComplete)
    req.pipe(res)
  }

  function writeToCache(err, arr) {
    if (err) return
    if (didAbort) return
    // update cache
    var result = arr.join('')
    cacheDb.put(url, result)
  }

  function onComplete(err, arr) {
    if (err) return
    if (didAbort) return
    // completion message
    var totalTime = hrtime(startTime)
    var timeMessage = prettyHrtime(totalTime)
    console.log('transform complete '+label+' ('+timeMessage+') => ' + url)
  }

  function onError(err){
    didAbort = true
    console.error('BAD '+label+':', url, err)
    console.error(err.stack)
    // completion message
    var totalTime = hrtime(startTime)
    var timeMessage = prettyHrtime(totalTime)
    console.log('transform interupted '+label+' ('+timeMessage+') => ' + url)
  }
}

function createCacheDb(){
  var db = null
  var label = 'transforms'
  // use cache db when available, fallback to in-memory
  if (CACHE_DB) {
    db = quickMulti(CACHE_DB, label)
  } else {
    db = levelup(label, { db: memdown })
  }
  return db
}
