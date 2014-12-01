var gulp = require('gulp'),
  plugins = require('gulp-load-plugins')(),
  server = require('gulp-develop-server')

gulp.task('server:start', function () {
  return gulp.src('src/server.js').pipe(server({
    path: 'src/server.js'
  }))
})

gulp.task('test', ['server:start'], function () {
  return gulp.src('test/**/*.js').pipe(plugins.mocha())
})

gulp.task('default', function () {
  gulp.start('server:start')

  plugins.watch(['src/*.js', 'test/**/*.js'], function (files, cb) {
    gulp.start('test', cb)
  })
})
