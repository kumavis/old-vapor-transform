const urlUtil = require('url')
const extend = require('xtend')
// const FakeSessionStorage = require('./globals/session-storage.js')
const PrefixedStorage = require('./globals/prefixed-storage.js')
const FakeLocation = require('./globals/location.js')
const FakeHistory = require('./globals/history.js')
var FakeXMLHttpRequest = require('./globals/xhr.js')
const ethereum = require('./globals/ethereum.js')
const interceptLinks = require('./globals/intercept-links.js')
const uniq = require('uniq')

var windowPrototype = window.__proto__
var _setTimeout = window.setTimeout
var _setInterval = window.setInterval
var _addEventListener = window.addEventListener

// injected from config
var vaporConfig = document.__VAPOR_CONFIG__

//
// expose environment variables
//

PROXY_URL = vaporConfig.PROXY_URL

//
// setup global objects
//

// parse origin
var baseUrl = vaporConfig.BASE_URL
var baseUrlData = urlUtil.parse(baseUrl)

// bind classes to origin
var location = new FakeLocation(baseUrl)
FakeXMLHttpRequest = FakeXMLHttpRequest.bind(null, baseUrlData)

// create globals
var windowGlobal = {}
var documentGlobal = {}

// store globals on document
document.__runtimeContext__ = {
  originalWindow: window,
  originalDocument: document,
  windowGlobal: windowGlobal,
  documentGlobal: documentGlobal,
  baseUrl: baseUrl,
  baseUrlData: baseUrlData,
}

//
// copy all properties
//

var SKIP = {}

//
// window
//

var windowGlobalOverrides = {
  window: windowGlobal,
  document: documentGlobal,
  top: windowGlobal,
  localStorage: SKIP,
  sessionStorage: SKIP,
  location: SKIP,
  frameElement: null,
  history: new FakeHistory(baseUrlData, location),
  localStorage: new PrefixedStorage(baseUrlData.host+'->', window.localStorage),
  sessionStorage: new PrefixedStorage(baseUrlData.host+'->', window.sessionStorage),
}

var windowGlobalExtras = {
  XMLHttpRequest: FakeXMLHttpRequest,
  setTimeout: fakeSetTimeout,
  setInterval: fakeSetInterval,
  addEventListener: fakeAddEventListener,
  removeEventListener: fakeRemoveEventListener,
  // ethereum specific
  web3: ethereum(baseUrlData),
}

var externalGlobals = {/* INSERT EXTERNAL GLOBALS HERE */}
// windowGlobalExtras = extend(windowGlobalExtras, externalGlobals)

// cloneOntoObject(window, windowGlobal, windowGlobalOverrides, windowGlobalExtras)

// setup prototype chain

// in context -> RealWindow ( must copy all props here onto FakeWindow )
//               FakeWindow <- accessed via `window`
//               WindowPrototype
//               EventTarget
//               Object

// var windowEventTarget = window.__proto__
// window.__proto__ = windowGlobal
// windowGlobal.__proto__ = windowEventTarget

windowGlobalOverrides = extend(windowGlobalOverrides, windowGlobalExtras, externalGlobals)
hackThePlanet(window, windowGlobal, windowGlobalOverrides, true)
// setup prototype chain
hookPrototypalChain()

//
// document
//

var documentGlobalOverrides = {
  location: SKIP,
}

var documentGlobalExtras = {
  cookie: '',
  defaultView: windowGlobal,
}

// cloneOntoObject(document, documentGlobal, documentGlobalOverrides, documentGlobalExtras)
documentGlobalOverrides = extend(documentGlobalOverrides, documentGlobalExtras)
hackThePlanet(document, documentGlobal, documentGlobalOverrides)
// setup prototype chain
documentGlobal.__proto__ = document

//
// additional overrides
//

// location, history

Object.defineProperty(windowGlobal, 'location', {
  get: function(){
    return location
  },
  set: function(value){
    location.replace(value)
    return value
  },
})

Object.defineProperty(documentGlobal, 'location', {
  get: function(){
    return location
  },
  set: function(value){
    location.replace(value)
    return value
  },
})

// intercept links to redirect to html transforming links
interceptLinks()


//
// ==================== util ===============
//

function hackThePlanet(source, target, overrides, handleHooking) {
  overrides = overrides || {}

  // 1) properties on source
  var props = getAllPropertyNames(source)
  for (var index in props) {
    var key = props[index]
    // set value from override
    if (key in overrides) {
      continue
    // no override - use value on original object
    } else {
      // accessing properties can trigger security-related DOMExceptions
      // so we wrap in a try-catch
      try {
        // bind functions
        var value = source[key]
        if (typeof value === 'function' && !nameIsBuiltinConstructor(key)) {
          target[key] = value.bind(source)
        // setup setter/getters for correct fallback (avoid illegal invocation error)
        } else {
          Object.defineProperty(target, key, {
            get: (handleHooking ? getterWithHooking : getter).bind(null, source, key),
            set: (handleHooking ? setterWithHooking : setter).bind(null, source, key),
          })
        }
      } catch (_) {}
    }
  }
  
  // 2) overrides and extras
  for (var key in overrides) {
    var value = overrides[key]
    if (value === SKIP) continue
    target[key] = value
  }

  function getter(source, key){
    return source[key]
  }

  function setter(source, key, value){
    var out = source[key] = value
    return out
  }

  function getterWithHooking(source, key){
    unhookPrototypalChain()
    var value = getter(source, key)
    hookPrototypalChain()
    return value
  }

  function setterWithHooking(source, key, value){
    unhookPrototypalChain()
    var value = setter(source, key, value)
    hookPrototypalChain()
    return value
  }

}

function hookPrototypalChain(){
  window.__proto__ = windowGlobal
  windowGlobal.__proto__ = windowPrototype
}

function unhookPrototypalChain(){
  window.__proto__ = windowPrototype
}

function getAllPropertyNames( obj ) {
  var props = []
  do {
    props = props.concat(Object.getOwnPropertyNames( obj ))
  } while ( obj = Object.getPrototypeOf( obj ) )
  uniq(props)
  return props
}

// heuristic for determining if its a constructor
function nameIsBuiltinConstructor(key){
  var firstChar = key.slice(0,1)
  var isCapital = firstChar !== firstChar.toLowerCase()
  var onWindow = window.hasOwnProperty(key)
  return isCapital && onWindow
}

// // copies all properties from source to target
// // binds functions to source
// // also adds extras

// function cloneOntoObject(source, target, overrides, extras) {
//   overrides = overrides || {}
//   extras = extras || {}
//   // 1) properties on source
//   var props = Object.getOwnPropertyNames(source)
//   for (var index in props) {
//     var key = props[index]
//     // set value from override
//     if (key in overrides) {
//       var value = overrides[key]
//       if (value === SKIP) continue
//       target[key] = value
//     // no override - use value on original object
//     } else {
//       // accessing properties can trigger security-related DOMExceptions
//       // so we wrap in a try-catch
//       try {
//         // bind functions
//         if (typeof source[key] === 'function') {
//           target[key] = source[key].bind(source)
//         // setup setter/getters for correct fallback (avoid illegal invocation error)
//         } else {
//           Object.defineProperty(target, key, {
//             get: function(source, key){ return source[key] }.bind(null, source, key),
//             set: function(source, key, value){ return source[key] = value }.bind(null, source, key),
//           })
//         }
//       } catch (_) {}
//     }
//   }
//   // 2) extras
//   for (var key in extras) {
//     var value = extras[key]
//     target[key] = value
//   }
// }

// setTimeout, setInterval

function fakeSetTimeout(cb, time) {
  return _setTimeout(cb.bind(windowGlobal), time)
}

function fakeSetInterval(cb, time) {
  return _setInterval(cb.bind(windowGlobal), time)
}

// add event listener
function fakeAddEventListener(type, listener, useCapture) {
  _addEventListener(type, function(event){
    var newEvent = event
    if (event.source === window) {
      // wrap event object to shadow source
      newEvent = {}
      cloneOntoObject(event, newEvent, { source: windowGlobal })
    }
    listener.call(windowGlobal, newEvent)
  }, useCapture)
}

function fakeRemoveEventListener(type, listener, useCapture) {
  console.warn('vapor - removeEventListener called - not implemented')
}
