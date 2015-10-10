var web3 = require('web3')
var BlockAppsProvider = require('blockapps-web3')
// expects global RPC_URL

module.exports = getEthereum

function getEthereum(origin) {
  // global.sandboxMessage is provided by iframe-sandbox

  var provider = new BlockAppsWeb3Provider({
    host: 'http://hacknet.blockapps.net',
    // host: 'http://api.blockapps.net',
    transaction_signer: { 
      // Can be any object that implements the following methods:
      hasAddress: function(address, callback) {
        console.log('metamask provider - asked for address ownership', address)
        callback(null, true)
      },
      signTransaction: function(txParams, callback) {
        txParams.gasLimit = txParams.gas
        var tx = new Transaction(txParams)
        tx.sign(new Buffer('0d0ba14043088cd629a978b49c8691deca5926f0271432bc0064e4745bac0a9f', 'hex'))
        callback(null, '0x'+tx.serialize().toString('hex'))
      },
    },
    coinbase: '0x985095ef977ba75fb2bb79cd5c4b84c81392dff6',
    accounts: ['0x985095ef977ba75fb2bb79cd5c4b84c81392dff6'],
  });

  // set provider
  web3.setProvider(provider)
  // disable set provider method
  web3.setProvider = function(){ console.log('web3.setProvider blocked by MetaMask.') }

  return web3
}