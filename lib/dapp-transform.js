var Trumpet = require('trumpet')
var request = require('request')
var url = require('url')
var generateEnvironment = require('./env-gen.js')

module.exports = transformHtml


function normalizeUrl(srcUrl, origin) {
  var pathname = origin.pathname

  if (pathname.slice(-1) !== '/') pathname += '/'
  var relPath = url.resolve(origin.protocol+'//'+origin.host, pathname)
  // console.log(origin.host, pathname, '=>', relPath)
  var result = url.resolve(relPath, srcUrl)
  // console.log(relPath, srcUrl, '=>', result)
  return result
}

function transformHtml(origin) {

  var location = url.parse(origin)
  var globalCtx = generateEnvironment(origin)
  // var afterGlobals = afterGlobals || ''
  var afterGlobals = ''

  var trumpet = Trumpet()

  trumpet.selectAll('script', function (script) {

    var srcUrl = script.getAttribute('src')
    if (!srcUrl) return

    var normalizedSrcUrl = normalizeUrl(srcUrl, location)

    if (globalCtx) {
      script.removeAttribute('src')
      var nodeStream = script.createWriteStream()
      nodeStream.write(';(function(_window, _document){\n\n')
      nodeStream.write(globalCtx[0])
      nodeStream.write(';\n')
      nodeStream.write(afterGlobals)
      nodeStream.write(';;\n\n')
      var getStream = request( normalizedSrcUrl )

      // dont pipe directly -- we want to close the IIFE on end
      getStream.on('data', function(data){
        nodeStream.write(data)
      })
      getStream.on('end', function(data){
        nodeStream.write('\n\n;;'+globalCtx[1])
        nodeStream.write('\n\n})(window, document);')
        nodeStream.end()
      })

      nodeStream.on('error', function(err){ throw err })
      getStream.on('error', function(err){ throw err })
    } else {
      script.setAttribute('src', normalizedSrcUrl)
    }

  })

  trumpet.selectAll('link', function (script) {
    var srcUrl = script.getAttribute('href')
    var normalizedSrcUrl = normalizeUrl(srcUrl, location)
    script.setAttribute('href', normalizedSrcUrl)
  })

  return trumpet
}