var fs = require('fs')
var browserify = require('browserify')
var uglify = require('uglify-stream');

var files = [
  'exec-init.js',
  'exec-wrapper.js',
]
files.forEach(buildFile)


function buildFile(filename){

  var stream = browserify('./lib/'+filename).bundle()
  
  if (process.env.NODE_ENV !== 'dev') {
    stream = stream.pipe(uglify())
  }

  stream = stream.pipe(fs.createWriteStream('./build/'+filename))
  stream.on('finish', console.log.bind(console, 'vapor-proxy BUILD: bundled "'+filename+'".'))

}