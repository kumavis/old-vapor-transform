var url = require('url')
var FakeLocation = require('./globals/location.js')
var FakeLocalStorage = require('./globals/local-storage.js')
var FakeHistory = require('./globals/history.js')
var FakeXMLHttpRequest = require('./globals/xhr.js')
var FakeAnchorElement = require('./globals/anchor.js')
var requireEthereum = require('./globals/ethereum.js')

//
// setup global objects
//

// parse origin
var originHref = "INSERT ORIGIN HERE"
var origin = url.parse(originHref)

// bind classes to origin
FakeXMLHttpRequest = FakeXMLHttpRequest.bind(null, origin)
FakeAnchorElement = FakeAnchorElement.bind(null, origin)

// create globals
var windowGlobal =  {}
var documentGlobal =  {}

// store globals on document
document.__runtimeContext__ = {
  windowGlobal: windowGlobal,
  documentGlobal: documentGlobal,
  originHref: originHref,
  origin: origin,
}

//
// copy all properties
//

var SKIP = {}

// window

var windowGlobalOverrides = {
  window: windowGlobal,
  document: documentGlobal,
  top: windowGlobal,
  location: SKIP,
  localStorage: new FakeLocalStorage(),
  sessionStorage: undefined,
  history: new FakeHistory(origin),
  frameElement: null,
}

var windowGlobalExtras = {
  Array: window.Array,
  Boolean: window.Boolean,
  Date: window.Date,
  Function: window.Function,
  Math: window.Math,
  Number: window.Number,
  Object: window.Object,
  RegExp: window.RegExp,
  String: window.String,
  Error: window.Error,
  TypeError: window.TypeError,
  parseInt: window.parseInt,
  XMLHttpRequest: FakeXMLHttpRequest,
  require: requireEthereum.bind(null, origin),
}

copyKeys(window, windowGlobal, windowGlobalOverrides, windowGlobalExtras)

// document

var documentGlobalOverrides = {
  body: SKIP,
  head: SKIP,
  cookie: '',
  createElement: createElement,
}

copyKeys(document, documentGlobal, documentGlobalOverrides)

// util

function copyKeys(source, target, overrides, extras) {
  // 1) properties on source
  for (var key in source) {
    var value
    if (overrides && key in overrides) {
      value = overrides[key]
      if (value === SKIP) continue
    } else {
      // bind for functions
      if (typeof source[key] === 'function') {
        value = source[key].bind(source)
      } else {
        value = source[key]
      }
    }
    target[key] = value
  }
  // 2) extras
  if (!extras) return
  for (var key in extras) {
    var value = extras[key]
    target[key] = value
  }
}

//
// window overrides
//

// location

var location = new FakeLocation(originHref)

Object.defineProperty(windowGlobal, 'location', {
  get: function(){
    return location
  },
  set: function(value){
    location.replace(value)
    return value
  },
})

//
// document overrides
//

// head, body

Object.defineProperty(documentGlobal, 'head', {
  get: function(){
    return document.head
  },
  set: function(value){
    document.head = value
    return value
  },
})

Object.defineProperty(documentGlobal, 'body', {
  get: function(){
    return document.body
  },
  set: function(value){
    document.body = value
    return value
  },
})

// createElement

function createElement(tagName) {
  if (tagName === 'a') {
    return new FakeAnchorElement(tagName, origin)
  } else {
    return document.createElement.apply(document, arguments)
  }
}
