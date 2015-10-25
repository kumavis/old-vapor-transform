var esquery = require('esquery')
var esprima = require('esprima')
var escodegen = require('escodegen')
var escope = require('escope')
var uniq = require('uniq')
var through2 = require('through2')

// precompiled esquery selectors
// -> "CallExpression:not([callee.type=MemberExpression])"
var NAKED_CALL_AST_SELECTOR = {"type":"compound","selectors":[{"type":"identifier","value":"CallExpression"},{"type":"not","selectors":[{"type":"attribute","name":"callee.type","operator":"=","value":{"type":"literal","value":"MemberExpression"}}]}]}

module.exports = {
  transformJs: transformJs,
  jsTransformStream: jsTransformStream,
}


function transformJs(src, opts) {
  opts = opts || {}
  var environment = opts.environment || {}
  var wrapper = environment.wrapper || ['','']
  // parse ast and analyze scope
  var ast = esprima.parse(src)
  var scopeManager = escope.analyze(ast)
  var scope = scopeManager.acquire(ast)
  // TRANSFORM ast
  transformAstForTopLevelVars(ast, scope)
  transformAstForImplicitGlobalDefs(ast, scope)
  transformAstForNakedCalls(ast)
  // GENERATE new src
  var transformedSrc = ''
  transformedSrc += wrapper[0]
  transformedSrc += escodegen.generate(ast)
  transformedSrc += wrapper[1]

  return transformedSrc
}

// js transform is not streaming
// buffer first then apply transform
function jsTransformStream(opts) {
  var jsBuffer = ''
  var transform = through2(bufferChunk, onComplete)

  function bufferChunk(chunk, enc, cb) {
    jsBuffer = jsBuffer + chunk.toString()
    cb()
  }

  function onComplete(cb) {
    try {
      var transformedSrc = transformJs(jsBuffer, opts)
      this.push(transformedSrc)
      cb()
    } catch(err) {
      console.error(err)
      cb(err)
    }
  }

  return transform
}

function transformAstForNakedCalls(ast) {

  // TRANSFORM
  // x()
  // [ but not `x.y()` ]
  // INTO
  // x.call(window)

  // CallExpression:not([callee.type=MemberExpression])

  // BEFORE
  // ├─ type: ExpressionStatement <---- match targets here
  // └─ expression
  //    ├─ type: CallExpression
  //    ├─ callee
  //    │  ├─ type: Identifier
  //    │  └─ name: x
  //    └─ arguments

  // AFTER
  // ├─ type: ExpressionStatement <---- match targets here
  // └─ expression
  //    ├─ type: CallExpression
  //    ├─ callee
  //    │  ├─ type: MemberExpression
  //    │  ├─ computed: false
  //    │  ├─ object
  //    │  │  ├─ type: Identifier
  //    │  │  └─ name: x
  //    │  └─ property
  //    │     ├─ type: Identifier
  //    │     └─ name: call
  //    └─ arguments
  //       └─ 0
  //          ├─ type: Identifier
  //          └─ name: window

  var matches = esquery.match(ast, NAKED_CALL_AST_SELECTOR)
  uniq(matches)
  matches.reverse()
  for (var i=0, l=matches.length; i<l; i++) {
    var match = matches[i]
    var originalCallee = match.callee
    match.callee = {
      type: 'MemberExpression',
      object: originalCallee,
      property: { type: 'Identifier', name: 'call' },
      computed: false,
    }
    match.arguments.unshift({ type: 'Identifier', name: 'window' })
  }

}

// transform top level var declarations to implicit globals
// js has some special behaviour in top-level context
// because of our wrapper, app code is no longer in top-level context
// after this transform, top level var declarations will correctly append
// to the global object
function transformAstForTopLevelVars(ast, scope){
  var topLevelFunctions = []

  scope.variables.forEach(function(variable){
    variable.defs.forEach(function(def){

      switch(def.node.type) {
    
        case 'VariableDeclarator':
          transformVarDeclarationToAssignment(def)
          break

        case 'FunctionDeclaration':
          topLevelFunctions.push(def.node.id)
          break

      }

    })
  })

  // append top level functions to global
  // inserts an assignment expression for each top level function
  topLevelFunctions.forEach(function(identifier){
    var node = implicitGlobalFnAssignment(identifier)
    ast.body.unshift(node)
  })

}

// finds all implicit globals `x = 15 // window.x = 15`
// and rewrites them as explicit globals
function transformAstForImplicitGlobalDefs(ast, scope){
  var globalDefs = getImplicitGlobalDefs(scope)
  globalDefs.forEach(transformImplicitGlobalToExplicitGlobal)
}

// creates an ast node for window.`id` = `id`
// appends a variable to the global object
function implicitGlobalFnAssignment(identifier){
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: createGlobalMemberExpression(identifier.name),
      right: identifier,
    },
  }
}

// transforms var declaration nodes in place
// turns a var declaration into an assignment on the global object
function transformVarDeclarationToAssignment(def) {
  var target = def.parent
  var identifier = def.node.id
  var init = def.node.init

  target.declarations = [{
    type: "VariableDeclarator",
    id: identifier,
    init: {
      type: 'AssignmentExpression',
      operator: '=',
      left: createGlobalMemberExpression(identifier.name),
      right: init,
    },
  }]
}

// makes implicit global assignments explicit in place
// turns an assignment node into an assignment on the global object
function transformImplicitGlobalToExplicitGlobal(node){
  var name = node.left.name
  node.left = createGlobalMemberExpression(name)
}

// gets assignment nodes for all implicit globals in a scope
function getImplicitGlobalDefs(scope){
  var implicitGlobalDefs = []
  scope.implicit.variables.forEach(function(varData){
    varData.defs.forEach(function(defData){
      implicitGlobalDefs.push(defData.node)
    })
  })
  return implicitGlobalDefs
}

function createGlobalMemberExpression(name){
  return {
    type: 'MemberExpression',
    computed: false,
    object: {
      type: 'Identifier',
      name: 'window',
    },
    property: {
      type: "Identifier",
      name: name,
    },
  }
}