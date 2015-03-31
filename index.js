var HttpMaster = require('http-master');
var treeify = require('treeify').asTree
var routerConfig = require('./router.json')
var webServer = require('./web.js')
var vaporServer = require('./vapor.js')
var startRpc = require('./rpc.js')
var PORT = process.env.PORT || 5000

webServer()
vaporServer()
startRpc()

var proxyConfig = { ports: {} }
proxyConfig.ports[PORT] = { router: routerConfig }

var httpMaster = new HttpMaster()
httpMaster.init(proxyConfig, function(err) {
  console.log('PROXY listening on', PORT)
  console.log('with config:\n', treeify(proxyConfig, true))
})