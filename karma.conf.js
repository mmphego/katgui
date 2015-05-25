module.exports = function(config) {
    config.set({
        browsers: ['PhantomJS'],
        browserNoActivityTimeout: 10000,
        browserDisconnectTolerance: 1,
        browserDisconnectTimeout: 10000,

        frameworks: ['jasmine'],

        preprocessors: {
            'app/**/*.html': 'ng-html2js',
            'app/**/!(*-spec).js': 'coverage'
        },

        ngHtml2JsPreprocessor: {
            moduleName: 'templates'
        },

        port: 9876,
        colors: true,
        logLevel: 'INFO',
        reporters: ['mocha', 'junit', 'coverage'],
        autoWatch: false, //watching is handled by grunt-contrib-watch
        singleRun: true,

        //collect junit report for jenkins integration
        junitReporter: {
            outputFile: 'test-results/junit.xml',
            suite: ''
        },

        coverageReporter: {
            reporters: [
                //{type: 'text', dir: 'test-results/', subdir: 'text', file: 'coverage.txt'},
                {type: 'html', dir: 'test-results/', subdir: 'html', file: 'coverage.html'},
                {type: 'cobertura', dir: 'test-results/', subdir: '.', file: 'cobertura.xml'}
            ]
        },

        files: {
            src: [  //this files data is also updated in the watch handler, if updated change there too
                '**/*.js',
                'bower_components/angular-mocks/angular-mocks.js',
                'bower_components/d3/d3.min.js'
                //createFolderGlobs('*.html'),
                //'app/**/*.html',
                //'bower_components/angular-material/angular-material.css',
                //'app/**/*-spec.js'
            ]
        }
    });
};
