var PORT = process.env.PORT || 5000
var express = require('express')
var request = require('request')
var cors = require('cors')
var dappTransform = require('./lib/dapp-transform.js')


var app = express()
app.use(cors())

// transform dapp
app.get('/dapp/:target', function (req, res) {
  var url = req.params.target
  console.log('transforming => '+url)
  getDapp(url)
    .pipe(res)
    .on('error', function(err){
      res.status(500).send()
    })
})

// generic proxy
app.all('/:target', function (req, res) {
  console.log('proxying => '+req.params.target)
  req
    .pipe(forwardReq(req))
    .pipe(res)
    .on('error', function(err){
      res.status(500).send()
    })
})

app.listen(PORT)
console.log('Vapor Dapp-proxy listening on', PORT)


function getDapp(url) {
  var req = request(url)
  req.on('error', function(err){
    console.error('BAD DAPP:', url, err)
  })
  return req.pipe(dappTransform(url))
}

function forwardReq(original) {
  var req = request({
    method: original.method,
    uri: original.params.target,
    headers: original.headers,
  })
  req.on('error', function(err){
    console.error('BAD PROXY:', url, err)
  })
  return req
}