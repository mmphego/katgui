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
var streamqueue = require('streamqueue');
var jshint = require('gulp-jshint');
var jasmine = require('gulp-jasmine');
var stylish = require('jshint-stylish');
var domSrc = require('gulp-dom-src');
// var karma = require('gulp-karma');
var util = require('gulp-util');
var insert = require('gulp-insert');
var exec = require('child_process').exec;
var del = require('del');
var fs = require('fs');
var pkg = require('./package.json');

var htmlminOptions = {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
};

var buildDate = (new Date()).getTime();

gulp.task('clean', function () {
    return del('dist');
});

gulp.task('clean-tests', function () {
    return del('test-results');
});

gulp.task('clean:csstmp', ['css:material', 'css:main', 'css:concat', 'clean'], function (cb) {
    return del(['dist/main.app.full.min.css', 'dist/angular-material.min.css']);
});

gulp.task('css:material', ['clean'], function () {
    return gulp.src(['bower_components/angular-material/angular-material.min.css'])
        .pipe(gulp.dest('dist/'));
});

gulp.task('css:main', ['clean'], function () {

    return gulp.src(['bower_components/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
        'bower_components/angular-dashboard-framework/dist/angular-dashboard-framework.min.css',
        'app/app.less'])
        .pipe(insert.prepend('@fa-font-path: "fonts";'))
        .pipe(less().on('error', util.log))
        .pipe(cssmin({
            keepSpecialComments: false,
            shorthandCompacting: false,
            restructuring: false,
            aggressiveMerging: false,
            advanced: false
        }))
        .pipe(concat('main.app.full.min.css'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('css:concat', ['css:main', 'css:material', 'clean'], function () {
    return gulp.src(['dist/angular-material.min.css', 'dist/main.app.full.min.css'])
        .pipe(concat('app.full.min.css'))
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
        .pipe(insert.append('document.katguiBuildDate = ' + buildDate))
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
            $('head').append('<link rel="icon" type="image/png" href="images/favicon.ico" sizes="32x32">');
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

gulp.task('sounds', ['clean'], function () {
    return gulp.src('sounds/**')
        .pipe(gulp.dest('dist/sounds/'));
});

gulp.task('jshint', function () {
    gulp.src(['app/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

// gulp.task('test', ['clean-tests'], function() {
//     // Be sure to return the stream
//     // NOTE: Using the fake './foobar' so as to run the files
//     // listed in karma.conf.js INSTEAD of what was passed to
//     // gulp.src !
//     return gulp.src('./foobar')
//         .pipe(karma({
//             configFile: 'karma.conf.js',
//             action: 'run'
//         }))
//         .on('error', function(err) {
//             // Make sure failed tests cause gulp to exit non-zero
//             this.emit('end'); //instead of erroring the stream, end it
//         });
// });

var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
    gulp.src('.')
        .pipe(webserver({
            livereload: true,
            //directoryListing: true,
            open: true,
            fallback: 'index.html'
        }));
});

gulp.task('version:file', ['clean', 'js'], function () {
    fs.writeFileSync('dist/version.txt', '{"version": "' + pkg.version + '", "buildDate": "' + buildDate + '"}\n');
    exec('kat-get-version.py', function (error, stdout, stderr) {
        if (error) {
            console.error('exec error: ' + error);
            throw error;
        }
        fs.writeFileSync('dist/kat-version.txt', stdout);
    });
});

gulp.task('build', ['clean', 'css:material', 'css:main', 'css:concat', 'clean:csstmp', 'js', 'indexHtml', 'fonts', 'images', 'sounds', 'version:file']);
