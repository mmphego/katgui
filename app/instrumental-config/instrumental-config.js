(function () {

    angular.module('katGui')
        .controller('InstrumentalConfigCtrl', InstrumentalConfigCtrl);

    function InstrumentalConfigCtrl(ConfigService, NotifyService) {

        var vm = this;
        vm.sourceCatalogues = [];
        vm.noiseDiodeModels = [];
        vm.delayModels = [];
        vm.pointingModels = [];

        ConfigService.getSourceCataloguesList()
            .then(function(result) {
                result.data.forEach(function (sourceCatalogue) {
                    vm.sourceCatalogues.push({
                        fileName: sourceCatalogue.replace('user/catalogues/', ''),
                        filePath: sourceCatalogue
                    });
                });
            });

        ConfigService.getNoiseDiodeModelsList()
            .then(function(result) {
                result.data.forEach(function (noiseDiodeModel) {
                    vm.noiseDiodeModels.push({
                        fileName: noiseDiodeModel.replace('user/noise-diode-models/', ''),
                        filePath: noiseDiodeModel
                    });
                });
            });


        ConfigService.getDelayModelsList()
            .then(function(result) {
                result.data.forEach(function (delayModel) {
                    vm.delayModels.push({
                        fileName: delayModel.replace('user/delay-models/', ''),
                        filePath: delayModel
                    });
                });
            });


        ConfigService.getPointingModelsList()
            .then(function(result) {
                result.data.forEach(function (pointingModel) {
                    vm.pointingModels.push({
                        fileName: pointingModel.replace('user/pointing-models/', ''),
                        filePath: pointingModel
                    });
                });
            });

        vm.getFileContents = function (filePath) {
            ConfigService.getConfigFileContents(filePath)
                .then(function (result) {
                    NotifyService.showPreDialog(filePath, JSON.parse(result.data));
                });
        };

        //$scope.$on('$destroy', function () {
        //});
    }
})();
