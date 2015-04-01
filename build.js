var fs = require('fs')
var browserify = require('browserify')
var uglify = require('uglify-stream');

browserify('./lib/exec-wrapper.js')
  .bundle()
  .pipe(uglify())
  .pipe(fs.createWriteStream('./build/exec-wrapper.js'))