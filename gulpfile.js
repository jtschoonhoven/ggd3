var gulp       = require('gulp')
,   gutil      = require('gulp-util')
,   bower      = require('gulp-bower')
,   bowerFiles = require('main-bower-files')
,   concat     = require('gulp-concat')
,   wrap       = require('gulp-wrap')
,   indent     = require('gulp-indent')
,   sourcemaps = require('gulp-sourcemaps')
,   jshint     = require('gulp-jshint')
,   stylish    = require('jshint-stylish')
,   mocha      = require('gulp-mocha');


// These will be combined into a single file.
var sourceFiles = [
  'lib/index.js', 
  'lib/configure.js',
  'lib/parseData.js',
  'lib/mapData.js',
  'lib/draw.js',
  'lib/export.js'
];

var testFiles = './test/*.js';


// Build sourcemaps, concat files, and wrap in function.
gulp.task('concat', function() {
  return gulp.src(sourceFiles)
    .pipe(sourcemaps.init())
    .pipe(concat('ggd3.js', { newLine: '\n\n\n' }))
    .pipe(indent())
    .pipe(wrap('(function() {\n\n<%= contents %>\n\n})()'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'));
});


// Recompile on change.
gulp.task('watch', ['concat'], function() {
  return gulp.watch(sourceFiles, ['concat']);
});


// Do all setup tasks.
gulp.task('install', ['bower-install', 'bower-build']);


// Download and install 3rd party deps to bower folder.
gulp.task('bower-install', function() {
  return bower().pipe(gulp.dest('bower_components/'));
});


// Move main bower files to vendor folder.
gulp.task('bower-build', function() {
  return gulp.src(bowerFiles({ includeDev: true }))
    .pipe(gulp.dest('vendor'));
});


// Watch ggd3 for changes and run tests on save.
gulp.task('watch-test', ['test'], function() {
  return gulp.watch(['ggd3.js', 'test/test.js'], ['test']);
});


// Run test and lint.
gulp.task('test', ['mocha', 'lint']);


gulp.task('mocha', function() {
  gulp.src(testFiles, { read: false })
    .pipe(mocha({ reporter: 'spec' }))
    .on('error', function(err) { return gutil.log(err.stack || err.message); })
});


gulp.task('lint', function() {
  return gulp.src(sourceFiles.concat([testFiles]))
    .pipe(jshint({ expr: true }))
    .pipe(jshint.reporter(stylish));
});