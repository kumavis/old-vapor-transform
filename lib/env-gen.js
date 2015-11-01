var meowserify = require('meowserify')
var browserify = require('browserify')
var async = require('async')

module.exports = generateEnvironment

/*

This is an isomorphic browserify bundler.
It will generate some code used in the transforms.
This generated code is a template that needs somethings injected.
This generated code is not dynamic and only needs to be generated once.

*/

function generateEnvironment(opts, cb){
  opts = opts || {}

  if (process.browser) {
    var wrapperJs = meowserify(__dirname + '/exec-wrapper.js')
    finalizeEnv(opts, wrapperJs, cb)
  } else {
    var wrapperB = browserify([__dirname + '/exec-wrapper.js'])
    wrapperB.bundle(function(err, result){
      var wrapperJs = result.toString()
      finalizeEnv(opts, wrapperJs, cb)
    })
  }

}

function finalizeEnv(opts, wrapperJs, cb){

  var wrapper = wrapperJs.split(';;"INSERT CODE HERE";;')

  process.nextTick(
    cb.bind(null, null, {
      wrapper: wrapper,
    })
  )

}