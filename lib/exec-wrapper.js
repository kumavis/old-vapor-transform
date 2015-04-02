var __runtimeContext__ = _document.__runtimeContext__
var window = __runtimeContext__.windowGlobal
var document = __runtimeContext__.documentGlobal
var __originHref__ = __runtimeContext__.originHref
var __origin__ = __runtimeContext__.origin


// clean environment

var module = undefined
var process = undefined

// Add all properties on window to local context

var localCtx = Object.keys(window)
  .map(function(key){ return 'var '+key+' = window["'+key+'"];' })
  .join('\n')

// inject vars into context

eval(localCtx)

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