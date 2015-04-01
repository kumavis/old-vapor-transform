var HttpSyncProvider = require('ethereum.js/lib/httpsync.js')
var ethUtils = require('ethereumjs-util')

module.exports = VaporSyncProvider


function VaporSyncProvider(sendMessage, host) {
  this.handlers = []
  this.sendMessage = sendMessage
  this.http = new HttpSyncProvider(host)
}

VaporSyncProvider.prototype.send = function (payload) {

  switch (payload.method) {
    case 'web3_sha3':
      var hash = ethUtils.sha3(payload.params[0]).toString('hex')
      return wrapResponse(payload, hash)
    case 'eth_coinbase':
      // TODO - this should be injected from Vapor dapp starts
      var currentAddress = '0x2a630ddb127c5525c118627a95cff488648b0c15'
      return wrapResponse(payload, currentAddress)
    case 'eth_accounts':
      // TODO - this should be injected from Vapor dapp starts
      var currentAddress = '0x2a630ddb127c5525c118627a95cff488648b0c15'
      return wrapResponse(payload, [currentAddress])
    case 'eth_transact':
      this.sendMessage('transact', payload.params[0])
      return wrapResponse(payload, '')
    default:
      console.log('rpc method fallthrough:',payload.method)
      return this.http.send(payload)
  }

}

VaporSyncProvider.prototype.sendAsync = function (payload, cb) {

  switch (payload.method) {
    case 'web3_sha3':
      var hash = ethUtils.sha3(payload.params[0]).toString('hex')
      cb(null, wrapResponse(payload, hash))
    case 'eth_coinbase':
      // TODO - this should be injected from Vapor dapp starts
      var currentAddress = '0x2a630ddb127c5525c118627a95cff488648b0c15'
      cb(null, wrapResponse(payload, currentAddress))
    case 'eth_accounts':
      // TODO - this should be injected from Vapor dapp starts
      var currentAddress = '0x2a630ddb127c5525c118627a95cff488648b0c15'
      cb(null, wrapResponse(payload, [currentAddress]))
    case 'eth_transact':
      this.sendMessage('transact', payload.params[0])
      cb(null, wrapResponse(payload, ''))
    default:
      console.log('rpc method fallthrough:',payload.method)
      return this.http.sendAsync(payload, cb)
  }

}

function wrapResponse(payload, result){
  return {
    jsonrpc: payload.jsonrpc,
    id: payload.id,
    result: result,
  }
}