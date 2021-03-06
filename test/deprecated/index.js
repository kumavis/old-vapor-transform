var test = require('tape')
var fs = require('fs')
var from = require('from')
var iframeSandbox = require('iframe-sandbox')

var DappTransform = require('../index.js')


test('basic test', function(t){
  t.plan(1)

  var transform = DappTransform({
    origin: 'https://yummyy.am/toothpaste/',
  })

  setupTest('basic', transform, function(sandbox){
    sandbox.on('message', function(){
      t.ok(true, 'got message from sandbox')
    })
  })

})

test('can insert globals', function(t){
  t.plan(1)

  var transform = DappTransform({
    origin: 'https://yummyy.am/toothpaste/',
    externalGlobals: {
      assert: 'sandboxMessage',
    }
  })

  setupTest('globals', transform, function(sandbox){
    sandbox.on('message', function(){
      t.ok(true, 'got message from sandbox')
    })
  })

})

test('window and this', function(t){
  t.plan(11)

  var transform = DappTransform({
    origin: 'https://yummyy.am/toothpaste/',
  })

  autoTest('window-this', t, transform)

})

test('relative urls', function(t){
  t.plan(1)

  var transform = DappTransform({
    origin: 'https://yummyy.am/toothpaste/',
  })

  autoTest('relative-url', t, transform)

})

test('location', function(t){
  t.plan(33)

  var transform = DappTransform({
    origin: 'https://yummyy.am:9292/toothpaste/?beep%20boop#nix nax',
  })

  remoteTest('location-history', t, transform)

})

test('etc', function(t){
  t.plan(7)

  var transform = DappTransform({
    origin: 'https://yummyy.am/toothpaste/',
  })

  remoteTest('etc', t, transform)

})

test('dom-events', function(t){
  t.plan(2)

  var transform = DappTransform({
    origin: 'https://yummyy.am/toothpaste/',
  })

  remoteTest('dom-events', t, transform)

})

// util

function setupTest(testFileName, transform, cb) {
  iframeSandbox({
    container: document.body,
    // src: 'http://frame.vapor.to/',
  }, function(err, sandbox){

    var inputStream = fetchTestStream(testFileName)
    var sandboxStream = sandbox.createWriteStream()
    
    inputStream
      .pipe(transform)
      .pipe(sandboxStream)

    cb(sandbox)

  })
}

function autoTest(testFileName, t, transform) {
  setupTest(testFileName, transform, function(sandbox){
    
    sandbox.on('message', function(tests){
      tests.forEach(function(data){
        t.ok(data.test, data.message)
      })
    })

  })
}

function remoteTest(testFileName, t, transform) {
  setupTest(testFileName, transform, function(sandbox){
    sandbox.on('message', function(tests){
      tests.forEach(function(data){
        t[data.method].apply(t, data.args)
      })
    })
  })
}


var testFiles = {
  'basic': fs.readFileSync(__dirname+'/basic.html'),
  'globals': fs.readFileSync(__dirname+'/globals.html'),
  'window-this': fs.readFileSync(__dirname+'/window-this.html'),
  'relative-url': fs.readFileSync(__dirname+'/relative-url.html'),
  'location-history': fs.readFileSync(__dirname+'/location-history.html'),
  'etc': fs.readFileSync(__dirname+'/etc.html'),
  'dom-events': fs.readFileSync(__dirname+'/dom-events.html'),
}

function fetchTestStream(name) {
  return from([testFiles[name]])
}