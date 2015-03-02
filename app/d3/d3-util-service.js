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

        //the status class in the sensor objects that we get are numbers but we need
        //these string values so that we can apply proper class names to the html sensor elements
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
                default:
                    return 'inactive';
            }
        };

        //trim unnecessary characters from sensor names and bind to the new attribute in the directive classes
        api.trimmedReceptorName = function (d, argName) {
            if (d.depth > 0) {
                d.sensorValue.trimmedName = d.sensorValue.trimmedName.replace(argName + '_', '');
                return d.sensorValue.trimmedName;
            } else {
                return d.name;
            }
        };

        //convenience function to create the id's for the html elements that needs to be styled
        api.createSensorId = function (d, rootName) {
            if (d.depth > 0) {
                return rootName + "_" + d.sensor;
            } else {
                return d.name + "_" + d.sensor;
            }
        };

        //convenience function to populate every item's tooltip
        api.applyTooltipValues = function (node, tooltip) {
            //d.on is not defined while transitioning
            if (node.on) {
                node.on("mouseover", function (d) {
                    updateTooltipValues(d, tooltip);
                    tooltip.style("visibility", "visible");
                }).on("mousemove", function (d) {
                    updateTooltipValues(d, tooltip);
                    tooltip
                        .style("top", (d3.event.layerY + 5 + angular.element('#ui-view-container-div').scrollTop()) + "px")
                        .style("left", (d3.event.layerX + 5 + angular.element('#ui-view-container-div').scrollLeft()) + "px");
                }).on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                });
            }
        };

        function updateTooltipValues(d, tooltip) {
            tooltip.html(
                "sensor: " + (d.depth === 0? d.name + ":" + d.sensor : d.sensor) +
                "<br/>value: " + d.sensorValue.value +
                "<br/>status: " + api.statusClassFromNumber(d.sensorValue.status) +
                "<br/>timestamp: " + moment.utc(d.sensorValue.timestamp, 'X').format('HH:mm:ss DD-MM-YYYY')
            );
        }

        //convenience function to create the tooltip div on the given element
        api.createTooltip = function (element) {
            return d3.select(element).append('div')
                .attr('class', 'treemap-tooltip')
                .style('visibility', 'hidden')
                .style('background-color', '#ffffff');
        };

        //because we subscribe to monitor for our data and have to wait for our data to trickle in
        //we cant just immediately bind to our data, this convenience function waits until we have
        //data that we can bind to and returns a promise that the client can wait on
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
