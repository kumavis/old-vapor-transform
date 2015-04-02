module.exports = FakeHistory


function FakeHistory(origin) {
  this._origin = origin
  Object.defineProperty(this, 'state', {
    get: function(){ return null },
    set: function(value){ return value },
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