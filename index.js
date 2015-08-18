const express = require('express')
const request = require('request')
const cors = require('cors')
const quickMultilevel = require('quick-multilevel')
const DappTransform = require('dapp-transform')
const prettyHrtime = require('pretty-hrtime')
const eos = require('end-of-stream')
const readToEnd = require('readtoend').readToEnd
const PORT = process.env.PORT || 9000
const CACHE_DB = process.env.CACHE_DB

if (CACHE_DB) {
  var transformCache = quickMultilevel(CACHE_DB)  
}

var app = express()
app.use(cors())

// transform dapp
app.get('/:target', function(req, res) {
  var url = req.params.target
  
  if (CACHE_DB) {
    transformCache.get(url, checkCache)
  } else {
    fetchDapp()
  }

  function checkCache(err, result){
    if (err || !result) {
      // cache miss
      console.log('CACHE MISS -', url)
      fetchDapp()
    } else {
      // cache hit
      console.log('CACHE HIT -', url)
      res.send(result)
    }
  }

  function fetchDapp(err, result){
    var timerStart = process.hrtime()
    var didAbort = false
    
    try {
      // request
      var dappReq = request({
        url: url,
        // dont follow redirects, forward them
        followRedirect: function(dappRes){
          didAbort = true
          onRedirect(dappRes)
          return false
        },
      })
    } catch (err) {
      return onError(err)
    }

    dappReq.on('error', onError)

    // transform
    var dappTransform = DappTransform({ origin: url })

    // log on start
    dappReq.once('data', function(err) {
      if (didAbort) return
      console.log('transforming => ' + url)
    })

    // write result to cache
    if (CACHE_DB) {
      readToEnd(dappTransform, function(err, result){
        if (didAbort) return
        if (err) return console.error('TRANSFORM FAILED:', url, err)
        transformCache.put(url, result)
      })
    }

    // log completion
    eos(res, function(){
      if (didAbort) return
      var timerDuration = process.hrtime(timerStart)
      console.log('transform completed (',prettyHrtime(timerDuration),') =>',url)
    })
    
    // request then transform then respond
    dappReq.pipe(dappTransform).pipe(res)

    function onError(err){
      console.error('BAD DAPP:', url, err)
    }
  }

  function onRedirect(dappRes){
    var newUrl = dappRes.headers.location
    var status = dappRes.statusCode
    console.log('REDIRECT ('+status+')', url, '=>', newUrl)
    res.redirect(status, newUrl)
  }

})

app.listen(PORT)
console.log('Vapor Dapp transform listening on', PORT)
