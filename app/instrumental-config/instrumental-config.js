(function () {

    angular.module('katGui')
        .controller('InstrumentalConfigCtrl', InstrumentalConfigCtrl);

    function InstrumentalConfigCtrl(ConfigService, NotifyService) {

        var vm = this;
        vm.sourceCatalogues = [];
        vm.noiseDiodeModels = [];
        vm.delayModels = [];
        vm.pointingModels = [];
        vm.correlators = [];
        vm.cam2speadList = [];

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

        ConfigService.getCorrelatorsList()
            .then(function(result) {
                result.data.forEach(function (correlator) {
                    vm.correlators.push({
                        fileName: correlator.replace('user/correlators/', ''),
                        filePath: correlator
                    });
                });
            });

        ConfigService.getCam2SpeadList()
            .then(function(result) {
                result.data.forEach(function (cam2spead) {
                    vm.cam2speadList.push({
                        fileName: cam2spead.replace('user/cam2spead/', ''),
                        filePath: cam2spead
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
