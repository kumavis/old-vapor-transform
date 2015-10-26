// polyfill Object.observe
require('object.observe')

module.exports = PrefixedStorage

var defaultStorage = window.localStorage

function PrefixedStorage(prefix, storageObj) {
  var self = this
  storageObj = storageObj || defaultStorage

  self.setItem = setItem
  self.getItem = getItem
  self.removeItem = removeItem

  // load existing storage
  Object.keys(storageObj)
  .filter(startsWithPrefix)
  .map(loadFromStorage)

  // observe direct sets on PrefixedStorage
  Object.observe(self, function(changes){ changes.forEach(handleChange) })

  function startsWithPrefix(key){
    return key.slice(0, prefix.length) === prefix
  }

  function loadFromStorage(key){
    var actualKey = key.slice(prefix.length)
    self[actualKey] = storageObj[key]
  }

  function handleChange(change){
    if (change.type === 'delete') {
      removeItem(change.name)
    } else {
      var newValue = self[change.name]
      setItem(change.name, newValue)
    }
  }

  function setItem(key, value) {
    storageObj[prefix+key] = value
    var oldValue = self[key]
    if (oldValue !== value) {
      self[key] = value
    }
    return value
  }

  function getItem(key) {
    var value = storageObj[prefix+key]
    return value
  }

  function removeItem(key) {
    delete storageObj[prefix+key]
    delete self[key]
  }
}

