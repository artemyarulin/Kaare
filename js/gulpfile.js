var gulp = require('gulp'),
  merge = require('merge-stream'),
  addsrc = require('gulp-add-src'),
  del = require('del'),
  plugins = require('gulp-load-plugins')()

var js_vendor = [
  'bower_components/rxjs/dist/rx.all.js'
]

var js_custom = ['src/kaare.js',
  'src/!(kaare)*.js',
  'src/transports/*.js',
]

gulp.task('clean', function(cb) { del(['build'], cb) })

gulp.task('buildBase',['clean'], function () {
  return gulp.src(js_custom)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    .pipe(plugins.jshint.reporter('fail'))
    .pipe(plugins.traceur())
    .pipe(plugins.concat('kaare.js'))
    .pipe(gulp.dest('build'))
})

gulp.task('build',['buildBase'], function() {
  return gulp.src(js_vendor.concat('build/kaare.js'))
    .pipe(plugins.concat('kaare.full.js'))
    .pipe(gulp.dest('build'))
})

gulp.task('default', function () {
  plugins.watch(['src/**/*.js'], function (files, cb) {
    gulp.start('build', cb)
  })
});
