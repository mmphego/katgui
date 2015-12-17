describe('StatusService', function () {

    beforeEach(module('katGui.services'));
    beforeEach(module('ui.router'));
    beforeEach(module('ngStorage'));

    var scope, StatusService;

    var receptors = ['m011', 'm022'];
    var statusTree = {
        sensor: 'sensors_ok',
        name: '',
        children: [{name: 'ap', sensor: 'sensor', children: [{name: 'bp', sensor: 'bp_sensor', children: []}]}, {name: 'dig', sensor: 'dig_sensor', children: []}]
    };

    var topStatusTree = {
        all_comms_ok: {children: [], name: 'All Comms OK', sensor: '', subs: [{name: '1', sensor: '1sensor'}, {name: '2', sensor: '2sensor'}, {name: '3', sensor: '3sensor'}]},
        all_sensors_ok: {children: [], name: 'All Sensors OK', sensor: '', subs: [{name: '1', sensor: '1sensor'}, {name: '2', sensor: '2sensor'}, {name: '3', sensor: '3sensor'}]}
    };

    var messageReceivedName = 'mon:anc.bms_kapb_temp';
    var messageValue = {
        received_timestamp: 1427795003.140423,
        status: 1,
        timestamp: 1427795003.135354,
        value: 22.4750928094
    };

    var receptorMessage = {
        received_timestamp: 1427795003.140423,
        status: 3,
        timestamp: 1427795003.135354,
        value: false
    };

    beforeEach(inject(function ($rootScope, _StatusService_) {
        StatusService = _StatusService_;
        scope = $rootScope.$new();
    }));

    // it('should push receptors and set the statusData per receptor node', function () {
    //     StatusService.setReceptorsAndStatusTree(statusTree, receptors);
    //     expect(StatusService.receptors).toEqual(receptors);
    //     expect(StatusService.statusData).toEqual({
    //         m011: Object({
    //             name: 'm011',
    //             sensor: 'sensors_ok',
    //             children: [Object({name: 'ap', sensor: 'sensor', children: [Object({name: 'bp', sensor: 'bp_sensor', children: []})]}), Object({name: 'dig', sensor: 'dig_sensor', children: []})]
    //         }),
    //         m022: Object({
    //             name: 'm022',
    //             sensor: 'sensors_ok',
    //             children: [Object({name: 'ap', sensor: 'sensor', children: [Object({name: 'bp', sensor: 'bp_sensor', children: []})]}), Object({name: 'dig', sensor: 'dig_sensor', children: []})]
    //         })
    //     });
    // });
    //
    // it('should set the top status tree data', function () {
    //     StatusService.setTopStatusTrees(topStatusTree);
    //     expect(StatusService.topStatusTrees).toEqual([Object({
    //         children: [Object({sensor: '1sensor', name: '1'}), Object({sensor: '2sensor', name: '2'}), Object({sensor: '3sensor', name: '3'})],
    //         name: 'All Comms OK',
    //         sensor: '',
    //         subs: [Object({name: '1', sensor: '1sensor'}), Object({name: '2', sensor: '2sensor'}), Object({name: '3', sensor: '3sensor'})]
    //     }), Object({
    //         children: [Object({sensor: '1sensor', name: '1'}), Object({sensor: '2sensor', name: '2'}), Object({sensor: '3sensor', name: '3'})],
    //         name: 'All Sensors OK',
    //         sensor: '',
    //         subs: [Object({name: '1', sensor: '1sensor'}), Object({name: '2', sensor: '2sensor'}), Object({name: '3', sensor: '3sensor'})]
    //     })]);
    // });

    // it('should apply the value of a message to a sensor', function () {
    //     var emitSpy = spyOn(scope.$root, '$emit');
    //     StatusService.messageReceivedSensors(messageReceivedName, messageValue);
    //     expect(emitSpy).toHaveBeenCalledWith('sensorUpdateReceived', Object({ name: 'anc.bms_kapb_temp', sensorValue: Object({ received_timestamp: 1427795003.140423, status: 1, timestamp: 1427795003.135354, value: 22.4750928094, name: 'anc.bms_kapb_temp' }) }) );
    // });
    //
    // it('should apply the value of a message to a sensor\'s treemap clone', function () {
    //     var emitSpy = spyOn(scope.$root, '$emit');
    //     StatusService.messageReceivedSensors(messageReceivedName, messageValue);
    //     expect(emitSpy).toHaveBeenCalledWith('sensorUpdateReceived',  Object({ name: 'anc.bms_kapb_temp', sensorValue: Object({ received_timestamp: 1427795003.140423, status: 1, timestamp: 1427795003.135354, value: 22.4750928094, name: 'anc.bms_kapb_temp' }) }));
    // });
    //
    // it('should apply a receptor message value', function () {
    //     StatusService.setReceptorsAndStatusTree(statusTree, receptors);
    //     StatusService.messageReceivedSensors('mon:m011.sensors_ok', receptorMessage);
    //     expect(StatusService.statusData['m011'].sensorValue).toEqual(receptorMessage);
    //     StatusService.statusData['m011treemapClone'] = StatusService.statusData['m011'];
    //     StatusService.messageReceivedSensors('mon:m011.sensors_ok', receptorMessage);
    //     expect(StatusService.statusData['m011treemapClone'].sensorValue).toEqual(receptorMessage);
    // });
    //
    // it('should apply a receptor message value to child sensor', function () {
    //     StatusService.setReceptorsAndStatusTree(statusTree, receptors);
    //     StatusService.messageReceivedSensors('mon:m011.sensor', receptorMessage);
    //     expect(StatusService.statusData['m011'].children[0].sensorValue).toEqual(receptorMessage);
    // });
});
