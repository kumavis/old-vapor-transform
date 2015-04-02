var url = require('url')
var proxyUrl = 'https://vapor-proxy.herokuapp.com/'

module.exports = FakeXMLHttpRequest


function FakeXMLHttpRequest(origin, mozParams) {
  var _this = this
  var xhr = this._xhr = new XMLHttpRequest(mozParams)
  this._origin = origin
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
  var newUrl = this._origin.resolve(url)
  newUrl = proxyUrl+encodeURIComponent(newUrl)
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