var ethereum = require('ethereum.js')
var VaporProvider = require('./vapor-provider.js')

module.exports = function(target){
  if (target === 'ethereum.js') {
    return getEthereum()
  } else {
    throw new Error('Vapor - we broke your require somehow. sorry.')
  }
}

function getEthereum() {
  ethereum.setProvider(new VaporProvider(sendMessage, 'https://vapor-rpc.herokuapp.com/'))
  ethereum.setProvider = function(){ console.log('ethereum.setProvider blocked.') }
  return ethereum
}

function sendMessage(){
  console.log('VaporProvider attempting to sendMessage:', arguments)
}