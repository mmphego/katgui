module.exports = function (config) {
    config.set({
        basePath: '',
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],

        files: [ //the order of these files are very important!
            'bower_components/d3/d3.js',
            'bower_components/angular/angular.js',
            'bower_components/ngstorage/ngStorage.js',
            'bower_components/jquery/dist/jquery.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'bower_components/angular-**/angular-**.js',
            'bower_components/angular-ui-router/release/angular-ui-router.js',
            'bower_components/angular-ui-utils/ui-utils.js',
            'bower_components/Sortable/Sortable.min.js',
            'bower_components/angular-dashboard-framework/dist/angular-dashboard-framework.min.js',
            'bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
            'bower_components/jsjws/jws-3.0.js',
            'bower_components/jsjws/ext/json-sans-eval-min.js',
            'bower_components/jsrsasign/jsrsasign-4.7.0-all-min.js',
            'bower_components/hammerjs/hammer.js',
            'bower_components/sockjs/sockjs.js',
            'bower_components/moment/moment.js',
            'bower_components/underscore/underscore.js',
            'bower_components/bootstrap/dist/js/bootstrap.js',
            'app/util/*.js',
            'app/services/*.js',
            'app/admin/*.js',
            'app/alarms/alarms.js',
            'app/alarms/alarms-notify.js',
            'app/alarms/alarms-spec.js',
            'app/alarms/alarms-notify-spec.js',
            'app/config/*.js',
            'app/d3/*.js',
            'app/health/*.js',
            'app/health/**/*.js',
            'app/landing/*.js',
            'app/*.js',
            'app/*-spec.js',
            'app/login-form/*.js',
            'app/operator-control/*.js',
            'app/scheduler/*.js',
            'app/scheduler/**/*.js',
            'app/sensor-graph/*.js',
            'app/sensor-list/*.js',
            'app/video/*.js',
            'app/weather/*.js',
            'app/widgets/**/*.js'
        ],
        preprocessors: {
            'app/**/*.html': 'ng-html2js',
            'app/**/!(*-spec).js': 'coverage'
        },

        ngHtml2JsPreprocessor: {
            moduleName: 'templates'
        },

        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        reporters: ['mocha', 'junit', 'coverage'],

        junitReporter: {
            outputFile: 'test-results/junit.xml',
            suite: ''
        },

        coverageReporter: {
            reporters: [
                {type: 'html', dir: 'test-results/', subdir: 'html', file: 'coverage.html'},
                {type: 'cobertura', dir: 'test-results/', subdir: '.', file: 'cobertura.xml'}
            ]
        }

    });
};
