var PORT = process.env.PORT || 6000
var express = require('express')
var request = require('request')
var cors = require('cors')
var dappTransform = require('dapp-transform')

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
    followRedirects: false
  })
  req.on('error', function(err) {
    console.error('BAD DAPP:', url, err)
  })
  return req.pipe(dappTransform(url))
}