(function () {

    angular.module('katGui')
        .service('ReceptorStateService', ReceptorStateService);

    function ReceptorStateService($rootScope, MonitorService) {

        MonitorService.subscribeToReceptorUpdates();

        var nowStr = moment().format('HH:mm:ss DD-MM-YYYY');
        this.receptorsData = [
            {
                name: "m011",
                inhibited: false
            },
            {
                name: "m022",
                inhibited: false
            },
            {
                name: "m033",
                inhibited: false
            },
            {
                name: "m044",
                inhibited: false
            },
            {
                name: "m055",
                inhibited: false
            }
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m000",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m062",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m063",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m000",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m062",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m063",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m000",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m062",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m063",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0001",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0011",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0621",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0631",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0002",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0012",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0622",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0632",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0003",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0013",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0623",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0633",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0004",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0014",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0624",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //},
            //{
            //    name: "m0634",
            //    state: "STOP",
            //    inhibited: false,
            //    since: '0:00:00',
            //    lastUpdate: nowStr
            //}
        ];

        //no need to unbind singleton
        //
        //this.receptorMessageReceived = function (event, message) {
        //    var sensorNameList = message.name.split(':');
        //    var sensor = sensorNameList[0];
        //    var sensorName = sensorNameList[1];
        //    this.receptorsData.forEach(function (item) {
        //
        //        if (item.name === sensor) {
        //            if (sensorName === 'mode' && item.state !== message.value) {
        //                item.state = message.value;
        //            } else if (sensorName === 'inhibited' && item.inhibited !== message.value) {
        //                item.inhibited = message.value;
        //            }
        //
        //            item.lastUpdate = moment(message.time, 'X').format('HH:mm:ss DD-MM-YYYY');
        //        }
        //
        //    });
        //};
        //
        //$rootScope.$on('receptorMessage', this.receptorMessageReceived);

        return this;
    }
})();
