var Trumpet = require('trumpet')
var request = require('request')
var url = require('url')
var generateEnvironment = require('./env-gen.js')

module.exports = transformHtml


function transformHtml(origin) {

  var location = url.parse(origin)
  var environment = generateEnvironment(origin)

  var trumpet = Trumpet()

  trumpet.selectAll('head', function (node) {
    var readStream = node.createReadStream()
    var writeStream = node.createWriteStream()
    writeStream.write('<'+'script'+'>')
    writeStream.write(environment.init)
    writeStream.write('</'+'script'+'>')
    readStream.pipe(writeStream)
  })

  trumpet.selectAll('script', function (node) {

    var srcUrl = node.getAttribute('src')
    
    if (srcUrl) {

      var destUrl = normalizeUrl(srcUrl, location)

      node.removeAttribute('src')
      var nodeStream = node.createWriteStream()
      nodeStream.write(';(function(_window, _document){\n\n')
      nodeStream.write(environment.wrapper[0])
      nodeStream.write(';;\n\n')
      var getStream = request( destUrl )

      // dont pipe directly -- we want to close the IIFE on end
      getStream.on('data', function(data){
        nodeStream.write(data)
      })
      getStream.on('end', function(data){
        nodeStream.write('\n\n;;'+environment.wrapper[1])
        nodeStream.write('\n\n})(window, document);')
        nodeStream.end()
      })

      nodeStream.on('error', function(err){ throw err })
      getStream.on('error', function(err){ throw err })

    } else {

      debugger

    }

  })

  trumpet.selectAll('link', function (script) {
    
    var srcUrl = script.getAttribute('href')
    if (srcUrl) {

      var destUrl = normalizeUrl(srcUrl, location)
      destUrl = proxyUrl(destUrl)
      script.setAttribute('href', destUrl)

    } else {

      debugger

    }

  })

  return trumpet
}

function normalizeUrl(srcUrl, origin) {
  var pathname = origin.pathname

  if (pathname.slice(-1) !== '/') pathname += '/'
  var relPath = url.resolve(origin.protocol+'//'+origin.host, pathname)
  // console.log(origin.host, pathname, '=>', relPath)
  var result = url.resolve(relPath, srcUrl)
  // console.log(relPath, srcUrl, '=>', result)
  return result
}

function proxyUrl(srcUrl) {
  var destUrl = 'https://vapor-proxy.herokuapp.com/'+encodeURIComponent(srcUrl)
  return destUrl
}