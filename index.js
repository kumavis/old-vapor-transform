var PORT = process.env.PORT || 5000
var express = require('express')
var request = require('request')
var cors = require('cors')
var dappTransform = require('./lib/dapp-transform.js')

var app = express()
app.use(cors())

app.get('/:target', function (req, res) {
  var url = req.params.target
  console.log('proxying => '+url)
  request(url)
    .pipe(res)
})

app.get('/dapp/:target', function (req, res) {
  var url = req.params.target
  console.log('transforming => '+url)

  getDapp(url)
    .pipe(res)
})

app.listen(PORT)
console.log('Vapor Dapp-proxy listening on', PORT)

function getDapp(url) {
  return request(url)
    .pipe(dappTransform(url))
}