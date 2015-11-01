const async = require('async')
const express = require('express')
const request = require('request')
const cors = require('cors')
const eos = require('end-of-stream')
const hrtime = require('browser-process-hrtime')
const prettyHrtime = require('pretty-hrtime')
const HtmlTransform = require('./index.js').HtmlTransform
const JsTransform = require('./index.js').JsTransform
const CssTransform = require('./index.js').CssTransform
const generateEnvironment = require('./index.js').generateEnvironment
const PORT = process.env.PORT || 9000


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

  // transform html
  app.get('/html/:target', function(req, res) {
    var targetUrl = req.params.target
    var skipInit = !req.query.init
    var transform = HtmlTransform({
      targetUrl: targetUrl,
      environment: environment,
    })
    performTransform('html', targetUrl, transform, res)
  })

  // transform js
  app.get('/js/:target', function(req, res) {
    var targetUrl = req.params.target
    var transform = JsTransform({
      targetUrl: targetUrl,
      environment: environment,
    })
    performTransform('js', targetUrl, transform, res)
  })

  // transform css
  app.get('/css/:target', function(req, res) {
    var targetUrl = req.params.target
    var transform = CssTransform({
      targetUrl: targetUrl,
      environment: environment,
    })
    performTransform('css', targetUrl, transform, res)
  })

  // static assets
  app.get('/static/init.js', function(req, res) {
    res.send(environment.init)
  })

  app.listen(PORT, cb)
}

// request target, perform tranform, respond
// handles errors during this process
function performTransform(label, url, transformStream, res){
  var startTime = hrtime()
  var didAbort = false
  
  try {
    // request
    var req = request({ url: url })
  } catch (err) {
    return onError(err)
  }

  req.on('error', onError)

  // log on start
  req.once('data', function(err) {
    if (didAbort) return
    console.log('transforming '+label+' => ' + url)
  })
  
  // request then transform then respond
  var processStream = req
  .pipe(transformStream)
  .pipe(res)

  eos(processStream, function(){
    if (didAbort) return
    var totalTime = hrtime(startTime)
    var timeMessage = prettyHrtime(totalTime)
    console.log('transform complete '+label+' ('+timeMessage+') => ' + url)
  })

  function onError(err){
    didAbort = true
    console.error('BAD '+label+':', url, err)
    console.error(err.stack)
    var totalTime = hrtime(startTime)
    var timeMessage = prettyHrtime(totalTime)
    console.log('transform interupted '+label+' ('+timeMessage+') => ' + url)
  }
}
