var gulp = require('gulp'),
    merge = require('merge-stream'),
    addsrc = require('gulp-add-src'),
    del = require('del'),
    plugins = require('gulp-load-plugins')(),
    mochaPhantomJS = require('gulp-mocha-phantomjs')

var js_vendor = [
    'bower_components/rxjs/dist/rx.all.js'
]

var js_custom = ['src/kaare.js',
    'src/!(kaare)*.js',
    'src/transports/*.js',
]

var processExitOnError = true

var onError = function (err) {
    console.log('\033[91m' + err + '\033[0m')
    processExitOnError ? process.exit(1) : this.emit('end')
}

gulp.task('clean', function (cb) {
    del(['build'], cb)
})

gulp.task('buildBase', ['clean'], function () {
    return gulp.src(js_custom)
        .pipe(plugins.plumber({
            errorHandler: onError
        }))
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.jshint.reporter('fail'))
        .pipe(plugins.traceur())
        .pipe(plugins.stripDebug())
        .pipe(plugins.concat('kaare.js'))
        .pipe(gulp.dest('build'))
})

gulp.task('test', ['build'], function () {
    var jsonRules = require('./.test.jshintrc.json')
    jsonRules.lookup = false;

    var tests = gulp.src('test/integration/**.js')
        .pipe(plugins.plumber({
            errorHandler: onError
        }))
        .pipe(plugins.jshint(jsonRules))
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.jshint.reporter('fail'))
        .pipe(plugins.traceur())
        .pipe(plugins.concat('test.js'))
        .pipe(gulp.dest('build'))
    return merge(tests, gulp.src('test/runner.html').pipe(plugins.plumber({
        errorHandler: onError
    })).pipe(mochaPhantomJS({
        mocha: {},
        phantomjs: {
            settings: {
                localToRemoteUrlAccessEnabled: true
            }
        }
    })));
})

gulp.task('build', ['buildBase'], function () {
    return gulp.src(js_vendor.concat('build/kaare.js'))
        .pipe(plugins.concat('kaare.full.js'))
        .pipe(gulp.dest('build'))
})

gulp.task('default', function () {
    processExitOnError = false

    plugins.watch(['src/**/*.js', 'test/**/*.js'], function () {
        gulp.start('test')
    })
});
