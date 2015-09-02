var ethereum = require('web3')
var VaporProvider = require('./vapor-provider.js')
// expects global RPC_URL

module.exports = getEthereum

function getEthereum(origin) {
  var vaporConfig = document.__VAPOR_CONFIG__
  // global.sandboxMessage is provided by iframe-sandbox
  ethereum.setProvider(new VaporProvider(global.sandboxMessage, vaporConfig.RPC_URL))
  ethereum.setProvider = function(){ console.log('ethereum.setProvider blocked.') }
  return ethereum
}