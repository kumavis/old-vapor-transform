var fs = require('fs')
var path = require('path')

var wrapperFile = path.join(__dirname, '../build/exec-wrapper.js')
var wrapperSrc = fs.readFileSync(wrapperFile).toString()

var initFile = path.join(__dirname, '../build/exec-init.js')
var initSrc = fs.readFileSync(initFile).toString()

module.exports = function(origin){

  var initializer = initSrc.replace('"INSERT ORIGIN HERE"', '"'+origin+'"')
  var wrapper = wrapperSrc.split('"INSERT CODE HERE"')

  return {
    init: initializer,
    wrapper: wrapper,
  }

}