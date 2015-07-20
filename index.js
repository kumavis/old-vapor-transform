const express = require('express')
const request = require('request')
const cors = require('cors')
const quickMultilevel = require('quick-multilevel')
const DappTransform = require('dapp-transform')
const prettyHrtime = require('pretty-hrtime')
const duplexify = require('duplexify')
const eos = require('end-of-stream')
const readToEnd = require('readtoend').readToEnd
const PORT = process.env.PORT || 9000
const CACHE_DB = process.env.CACHE_DB

var transformCache = quickMultilevel(CACHE_DB)

var app = express()
app.use(cors())

// transform dapp
app.get('/:target', function(req, res) {
  var url = req.params.target
  console.log('transforming => ' + url)
  getDapp(url)
    .pipe(res)
    .on('error', function(err) {
      res.status(500).send()
    })
})

app.listen(PORT)
console.log('Vapor Dapp transform listening on', PORT)


function getDapp(url) {
  var duplex = duplexify()
  
  transformCache.get(url, function(err, result){
    // not in cache
    if (err || !result) {
      console.log('CACHE MISS -', url)
      var outStream = fetchDapp(url)
      duplex.setReadable(outStream)
      readToEnd(outStream, function(err, result){
        if (err) return
        transformCache.put(url, result)
      })
    } else {
      console.log('CACHE HIT -', url)
      duplex.push(result)
      duplex.push(null)
    }
  })

  return duplex
}

function fetchDapp(url) {
  var timerStart = process.hrtime()
  var req = request({
    url: url,
    // followRedirects: false
  })

  var dappTransform = DappTransform({
    origin: url,
  })
  
  req.on('error', function(err) {
    console.error('BAD DAPP:', url, err)
  })

  eos(dappTransform, function(){
    var timerDuration = process.hrtime(timerStart)
    console.log('completed (',prettyHrtime(timerDuration),') =>',url)
  })
  req.pipe(dappTransform)

  return dappTransform
}