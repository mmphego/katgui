//Experimental

/*jslint node: true */
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var gCheerio = require('gulp-cheerio');
var ngHtml2js = require("gulp-ng-html2js");
var ngannotate = require('gulp-ng-annotate');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var packagejson = require('./package.json');
var streamqueue = require('streamqueue');
var rimraf = require('rimraf');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var jasmine = require('gulp-jasmine');
var stylish = require('jshint-stylish');
var domSrc = require('gulp-dom-src');
var karma = require('gulp-karma');
var util = require('gulp-util');

var htmlminOptions = {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
};

gulp.task('clean', function () {
    rimraf.sync('dist');
});

gulp.task('clean-tests', function () {
    rimraf.sync('test-results');
});

gulp.task('css', ['clean'], function () {
    //todo use something like domSrc to pull this out of app.less
    return gulp.src(['bower_components/angular-material/angular-material.min.css',
        'bower_components/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
        'bower_components/angular-dashboard-framework/dist/angular-dashboard-framework.min.css',
        'app/app.less'])
        .pipe(less().on('error', util.log))
        .pipe(concat('app.full.min.css'))
        .pipe(cssmin({
            keepSpecialComments: false,
            shorthandCompacting: false,
            restructuring: false,
            aggressiveMerging: false,
            advanced: false
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('js', ['clean'], function () {

    var templateStream = gulp.src(['app/**/*.html'])
        .pipe(ngHtml2js({
            moduleName: 'katGui',
            prefix: "app/"
        }));

    var jsStream = domSrc({
        file: 'index.html',
        selector: 'script[data-build!="exclude"]',
        attribute: 'src'
    });
    var combined = streamqueue({objectMode: true});
    combined.queue(jsStream);
    combined.queue(templateStream);

    return combined.done()
        .pipe(concat('app.full.min.js'))
        .pipe(ngannotate())
        .pipe(uglify())
        .pipe(gulp.dest('dist/'));
});

gulp.task('indexHtml', ['clean'], function () {
    return gulp.src('index.html')
        .pipe(gCheerio(function ($) {
            $('script[data-remove!="exclude"]').remove();
            $('link').remove();
            $('body').append('<script src="app.full.min.js"></script>');
            $('head').append('<link rel="stylesheet" href="app.full.min.css">');
        }))
        .pipe(htmlmin(htmlminOptions))
        .pipe(gulp.dest('dist/'));
});

gulp.task('fonts', ['clean'], function () {
    return gulp.src(['bower_components/font-awesome/fonts/**', 'fonts/**'])
        .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('images', ['clean'], function () {
    return gulp.src('images/**')
        .pipe(gulp.dest('dist/images/'));
});

gulp.task('d3', ['clean'], function () {
    return gulp.src('bower_components/d3/d3.min.js')
        .pipe(gulp.dest('dist/bower_components/d3/'));
});

gulp.task('jshint', function () {
    gulp.src(['app/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('test', ['clean-tests'], function() {
    // Be sure to return the stream
    // NOTE: Using the fake './foobar' so as to run the files
    // listed in karma.conf.js INSTEAD of what was passed to
    // gulp.src !
    return gulp.src('./foobar')
        .pipe(karma({
            configFile: 'karma.conf.js',
            action: 'run'
        }))
        .on('error', function(err) {
            // Make sure failed tests cause gulp to exit non-zero
            this.emit('end'); //instead of erroring the stream, end it
        });
});

var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
    gulp.src('.')
        .pipe(webserver({
            livereload: true,
            //directoryListing: true,
            open: true
        }));
});

gulp.task('build', ['clean', 'css', 'js', 'indexHtml', 'fonts', 'images', 'd3']);
