var PORT = process.env.PORT || 9000
var express = require('express')
var request = require('request')
var cors = require('cors')
var DappTransform = require('dapp-transform')
var prettyHrtime = require('pretty-hrtime')
var eos = require('end-of-stream')

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
  var req = request({
    url: url,
    // followRedirects: false
  })
  req.on('error', function(err) {
    console.error('BAD DAPP:', url, err)
  })
  var timerStart = process.hrtime()
  var dappTransform = DappTransform({
    origin: url,
  })
  eos(dappTransform, function(){
    var timerDuration = process.hrtime(timerStart)
    console.log('completed (',prettyHrtime(timerDuration),') =>',url)
  })
  return req.pipe(dappTransform)
}