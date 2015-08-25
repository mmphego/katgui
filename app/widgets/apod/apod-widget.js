(function () {

    angular.module('katGui.widgets.apodWidget', ['adf.provider', 'katGui.util', 'katGui.services'])
        .config(configureApodWidget)
        .controller('ApodWidgetCtrl', ApodWidgetCtrl);

    function configureApodWidget(dashboardProvider) {
        dashboardProvider
            .widget('ApodWidget', {
                title: 'APOD',
                description: 'Container for the Astronomy Picture of the Day from NASA',
                templateUrl: 'app/widgets/apod/apod-widget.html',
                controllerAs: 'vm',
                controller: 'ApodWidgetCtrl'
            });
    }

    function ApodWidgetCtrl($scope, $rootScope, $http, $log, NotifyService) {

        var vm = this;
        vm.imgUrl = "";

        vm.loadApod = function (date) {
            vm.loadingApod = true;
            vm.selectedDate = date;
            vm.selectedDateString = vm.dateToString(vm.selectedDate);
            vm.todayDateString = vm.dateToString(new Date());
            var apodStr = "https://api.nasa.gov/planetary/apod?date=";
            apodStr += vm.selectedDateString;
            apodStr += "&api_key=YZ8q8SXxrxwGDcn9iUKRvCvmqkUydF2tzhUs21IU";
            $http.get(apodStr).then(function (result) {
                if (result.data.error) {
                    NotifyService.showSimpleToast("Could not retrieve the APOD " + result.data.error);
                    vm.selectedDate = new Date();
                    vm.selectedDateString = vm.dateToString(vm.selectedDate);
                    vm.errorText = result.data.error;
                } else {
                    vm.apodUrl = result.data.url;
                    vm.apodTitle = result.data.title;
                    vm.apodDescription = result.data.explanation;
                    vm.errorText = null;
                }
                vm.loadingApod = false;
            }, function (result) {
                if (result.data.error) {
                    vm.errorText = result.data.error.message;
                }
                $log.error(result);
                vm.loadingApod = false;
            });
        };

        vm.loadNext = function () {
            vm.selectedDate.setDate(vm.selectedDate.getDate() + 1);
            vm.loadApod(vm.selectedDate);
        };

        vm.loadPrevious = function () {
            vm.selectedDate.setDate(vm.selectedDate.getDate() - 1);
            vm.loadApod(vm.selectedDate);
        };

        vm.dateToString = function (date) {
            return moment(date).format('YYYY-MM-DD');
        };

        vm.openSelectedDateApod = function () {
            var shortDateString = moment(vm.selectedDate).format('YYMMDD');
            var url = "http://apod.nasa.gov/apod/ap" + shortDateString + ".html";
            $rootScope.openUrlInNewTab(url);
        };

        vm.onTimeSet = function (newDate) {
            if (newDate < new Date(1996, 05, 16) || newDate > new Date()) {
                vm.errorText = "Date must be between Jun 16, 1996 and today.";
            } else {
                vm.errorText = "";
                vm.loadApod(newDate);
            }
        };

        vm.loadApod(new Date());

        //$scope.$on('$destroy', function () {
        //});
    }
})();
