var fs = require('fs')
var path = require('path')

var filename = path.join(__dirname, '../build/exec-wrapper.js')
var src = fs.readFileSync(filename).toString()

module.exports = function(origin){

  src = src.replace('"INSERT ORIGIN HERE"', '"'+origin+'"')
  var output = src.split('"INSERT CODE HERE"')

  return output

}