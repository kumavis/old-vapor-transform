var url = require('url')
var FakeLocation = require('./globals/location.js')
var requireEthereum = require('./globals/ethereum.js')

// parse origin
var __originHref__ = "INSERT ORIGIN HERE"
var __origin__ = url.parse(__originHref__)

// pause on filecount, for debugging
_window.__hackCount = _window.__hackCount || 0;
// _window.console.log(++_window.__hackCount)
// if (_window.__hackCount === 16) debugger;




var window = _window.__hacked__
var document = _document.__hacked__
var globalCtx = []


if (window && document) {

  // globals already written, nothing to do

} else {

  // shadow globals
  var window =  {}
  var document =  {}
  _window.__hacked__ = window
  _document.__hacked__ = document

  //
  // Shadow Class implementations
  // TODO -- move to seperate files
  //

  // window.location

  var _location = new FakeLocation(__originHref__)

  // window.history

  function FakeHistory() {
    Object.defineProperty(this, 'state', {
      get: function(){ return null },
      set: function(){ debugger },
    })
  }
  FakeHistory.prototype.back = function(val){
    debugger
  }
  FakeHistory.prototype.forward = function(val){
    debugger
  }
  FakeHistory.prototype.go = function(val){
    debugger
  }
  FakeHistory.prototype.pushState = function(val){
    debugger
  }
  FakeHistory.prototype.replaceState = function(val){
    debugger
  }

  // XMLHttpRequest

  function FakeXMLHttpRequest() {
    var _this = this
    var xhr = this._xhr = new _window.XMLHttpRequest()
    addListener('onabort')
    addListener('onerror')
    addListener('onload')
    addListener('onloadend')
    addListener('onloadstart')
    addListener('onprogress')
    addListener('onreadystatechange')
    addListener('ontimeout')
    function addListener(name){
      xhr[name] = function(){
        // copy values
        _this.readyState = xhr.readyState
        _this.response = xhr.response
        _this.responseText = xhr.responseText
        _this.responseType = xhr.responseType
        _this.responseXML = xhr.responseXML
        _this.status = xhr.status
        _this.statusText = xhr.statusText
        _this.timeout = xhr.timeout
        _this.upload = xhr.upload
        _this.withCredentials = xhr.withCredentials
        if (!_this[name]) return
        // call handler
        _this[name].apply(this, arguments)
      }
    }
  }
  FakeXMLHttpRequest.prototype.open = function(method, url, async) {
    var newUrl = __origin__.resolve(url)
    return this._xhr.open(method, newUrl, async)
  }
  FakeXMLHttpRequest.prototype.abort = function() {
    return this._xhr.abort.apply(this._xhr, arguments)
  }
  FakeXMLHttpRequest.prototype.getAllResponseHeaders = function() {
    return this._xhr.getAllResponseHeaders.apply(this._xhr, arguments)
  }
  FakeXMLHttpRequest.prototype.getResponseHeader = function() {
    return this._xhr.getResponseHeader.apply(this._xhr, arguments)
  }
  FakeXMLHttpRequest.prototype.overrideMimeType = function() {
    return this._xhr.overrideMimeType.apply(this._xhr, arguments)
  }
  FakeXMLHttpRequest.prototype.send = function() {
    var xhr = this._xhr
    // copy values
    xhr.responseType = this.responseType
    xhr.timeout = this.timeout
    xhr.withCredentials = this.withCredentials
    return xhr.send.apply(xhr, arguments)
  }
  FakeXMLHttpRequest.prototype.setRequestHeader = function() {
    return this._xhr.setRequestHeader.apply(this._xhr, arguments)
  }

  // Element

  function FakeAnchorElement(tagName) {
    this.setAttribute('href', __originHref__)
  }
  FakeAnchorElement.prototype.setAttribute = function(key, val) {
    if (key === "href") {
      var newPath = url.parse(__origin__.resolve(val))
      this.href = newPath.href
      this.protocol = (newPath.protocol ? newPath.protocol.replace(/:$/, '') : '')
      this.host = newPath.host
      this.search = (newPath.search ? newPath.search.replace(/^\?/, '') : '')
      this.hash = (newPath.hash ? newPath.hash.replace(/^#/, '') : '')
      this.hostname = newPath.hostname
      this.port = newPath.port
      this.pathname = newPath.pathname
    } else {
      throw new Error('NotImplemented')
    }
  }

  //
  // globals to be exposed
  //

  var SKIP = {}

  // window

  var windowOverrides = {
    __hacked__: SKIP,
    window: SKIP,
    document: 'document',
    top: 'window',
    location: SKIP,
    localStorage: 'undefined',
    sessionStorage: 'undefined',
    history: 'new FakeHistory()',
    frameElement: 'null',
  }

  var windowExtras = {
    __window__: '_window',
    Array: '_window.Array',
    Boolean: '_window.Boolean',
    Date: '_window.Date',
    Function: '_window.Function',
    Math: '_window.Math',
    Number: '_window.Number',
    Object: '_window.Object',
    RegExp: '_window.RegExp',
    String: '_window.String',
    Error: '_window.Error',
    TypeError: '_window.TypeError',
    parseInt: '_window.parseInt',
    XMLHttpRequest: 'FakeXMLHttpRequest',
  }

  // TODO -- do this inline, instead of queing up an eval
  for (var key in _window) {
    var value
    if (key in windowOverrides) {
      value = windowOverrides[key]
      if (value === SKIP) continue
    } else {
      value = '_window["'+key+'"]'
      // bind for functions
      if (typeof _window[key] === 'function') {
        value += '.bind(_window)'
      }
    }
    globalCtx.push('window["'+key+'"] = '+value+';')
    // globalCtx.push('var '+key+' = window["'+key+'"];')
  }

  for (var key in windowExtras) {
    var value = windowExtras[key]
    globalCtx.push('window["'+key+'"] = '+value+';')
  }

  // document

  var documentOverrides = {
    __hacked__: SKIP,
    body: SKIP,
    head: SKIP,
    cookie: '""',
    // provide an anchor element that lies about its location
    createElement: [
      'function(tagName) {',
      '  if (tagName === "a") {',
      '    return new FakeAnchorElement(tagName)',
      '  } else {',
      '    return _document.createElement.apply(_document, arguments)',
      '  }',
      '}',
    ].join('\n'),
  }

  // TODO -- do this inline, instead of queing up an eval
  for (var key in _document) {
    var value
    if (key in documentOverrides) {
      value = documentOverrides[key]
      if (value === SKIP) continue
    } else {
      value = '_document["'+key+'"]'
      // bind for functions
      if (typeof _document[key] === 'function') {
        value += '.bind(_document)'
      }
    }
    globalCtx.push('document["'+key+'"] = '+value+';')
  }

  // final shenanigans

  var location = _location
  Object.defineProperty(window, 'location', {
    get: function(){ return _location },
    set: function(){ debugger },
  })

}

// web3 - ethereum.js

var require = requireEthereum

// clean environment

var module = undefined
var process = undefined

// Add all properties on window to local context
var localCtx = Object.keys(window)
  .map(function(key){ return 'var '+key+' = window["'+key+'"];' })
  .join('\n')
globalCtx.push(localCtx)

// inject vars into context

var generatedCode = globalCtx.join('\n')+';\n\n\n'
eval(generatedCode)



// run user code

;(function(){

  //
  // begin user code
  //

  ;;"INSERT CODE HERE";;

  //
  // end user code
  //

}).call(window)