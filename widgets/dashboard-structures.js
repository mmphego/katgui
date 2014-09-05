angular.module('katGui.dashboardStructure', ['adf'])
    .config(function(dashboardProvider){

        dashboardProvider
            .structure('6-6', {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-6'
                    }, {
                        styleClass: 'col-md-6'
                    }]
                }]
            })
            .structure('4-8', {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-4',
                        widgets: []
                    }, {
                        styleClass: 'col-md-8',
                        widgets: []
                    }]
                }]
            })
            .structure('12/4-4-4', {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-12'
                    }]
                }, {
                    columns: [{
                        styleClass: 'col-md-4'
                    }, {
                        styleClass: 'col-md-4'
                    }, {
                        styleClass: 'col-md-4'
                    }]
                }]
            })
            .structure('12/6-6', {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-12'
                    }]
                }, {
                    columns: [{
                        styleClass: 'col-md-6'
                    }, {
                        styleClass: 'col-md-6'
                    }]
                }]
            })
            .structure('12/6-6/12', {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-12'
                    }]
                }, {
                    columns: [{
                        styleClass: 'col-md-6'
                    }, {
                        styleClass: 'col-md-6'
                    }]
                }, {
                    columns: [{
                        styleClass: 'col-md-12'
                    }]
                }]
            });

    });


