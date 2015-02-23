angular.module('katGui.d3')

    .factory('d3Util', function ($q, $timeout, $rootScope) {

        var api = {};

        // Compute the treemap layout recursively such that each group of siblings
        // uses the same size (1×1) rather than the dimensions of the parent cell.
        // This optimizes the layout for the current zoom state. Note that a wrapper
        // object is created for the parent node for each group of siblings so that
        // the parent’s dimensions are not discarded as we recurse. Since each group
        // of sibling was laid out in 1×1, we must rescale to fit using absolute
        // coordinates. This lets us use a viewport to zoom.
        api.layout = function (d, mapLayout) {
            if (d._children) {
                mapLayout.nodes({_children: d._children});
                d._children.forEach(function (c) {
                    c.x = d.x + c.x * d.dx;
                    c.y = d.y + c.y * d.dy;
                    c.dx *= d.dx;
                    c.dy *= d.dy;
                    c.parent = d;
                    api.layout(c);
                });
            }
        };

        api.statusClassFromNumber = function (num) {
            switch (num) {
                case 0:
                    return 'unknown';
                case 1:
                    return 'nominal';
                case 2:
                    return 'warn';
                case 3:
                    return 'error';
                case 4:
                    return 'failure';
                case 5:
                    return 'unreachable';
                case 6:
                    return 'inactive';
            }
        };

        api.trimmedName = function (d, argName) {
            return d.name.replace('mon_proxy:agg_' + argName + '_', '');
        };

        api.createSensorId = function (d) {
            if (d.sensor) {
                return "sensor_name_" + d.name.replace(':', '_') + "_" + d.sensor.replace('.', '_');
            } else {
                return "sensor_name_" + d.name.replace(':', '_');
            }
        };

        api.rootName = function (d) {
            return d.parent ? name(d.parent) + "." + d.name : d.name;
        };

        api.applyTooltip = function (d, tooltip, dataMapName) {
            //d.on is not defined while transitioning
            if (d.on) {
                d.on("mouseover", function (d) {
                    if (d.objValue) {
                        tooltip.html(api.trimmedName(d, dataMapName) + " - " + api.statusClassFromNumber(d.objValue.status));
                    } else if (d.sensorValue) {
                        tooltip.html(api.trimmedName(d, dataMapName) + " - " + api.statusClassFromNumber(d.sensorValue.status));
                    }
                    tooltip.style("visibility", "visible");
                }).on("mousemove", function () {
                    tooltip
                        .style("top", (d3.event.layerY + 10) + "px")
                        .style("left", (d3.event.layerX + 10) + "px");
                }).on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                });
            }
        };

        api.createTooltip = function (e) {
            return d3.select(e).append('div')
                .attr('class', 'treemap-tooltip')
                .style('visibility', 'hidden')
                .style('background-color', '#ffffff');
        };

        api.waitUntilDataExists = function (data) {
            var deferred = $q.defer();
            var retries = 0, maxRetries = 50;

            //start checking later so that the promise is always returned before it can be resolved
            $timeout(function () {
                checkIfDataExists();
            }, 1);

            function checkIfDataExists() {
                if (data.children.length === 0 && retries < maxRetries) {
                    $timeout(function () {
                        checkIfDataExists();
                    }, 500);
                    retries++;
                } else if (retries >= maxRetries) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            }

            return deferred.promise;
        };

        api.displayInitErrorMessage = function (dataMapName) {
            $rootScope.showSimpleDialog('Error displaying data', 'Could not display the Receptor Status data, contact the katGUI support team.');
            console.error('Error binding to StatusService data for receptor ' + dataMapName);
        };

        return api;
    });
