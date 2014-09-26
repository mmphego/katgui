angular.module('katGui.health', ['katGui.d3'])

    .controller('HealthCtrl', function ($scope, $window) {

        $scope.treemapDisplayValue = 'size';

        $scope.treeChartSize = { width: $window.innerWidth, height: $window.innerHeight };

        $scope.$watch(function () {
            return $window.innerWidth;
        }, function (value) {
            $scope.treeChartSize.width = value - 7;
        });

        $scope.$watch(function () {
            return $window.innerHeight;
        }, function (value) {
            $scope.treeChartSize.height = value - 70;
        });

        $scope.d3TreemapData =
        {
            "name": "Sub-Array 1",
            "children": [
                {
                    "name": "ANT1",
                    "children": [
                        {
                            "name": "cluster",
                            "children": [
                                {"name": "AgglomerativeCluster", "value": 100},
                                {"name": "CommunityStructure", "value": 100},
                                {"name": "HierarchicalCluster", "value": 100},
                                {"name": "MergeEdge", "value": 100}
                            ]
                        },
                        {
                            "name": "graph",
                            "children": [
                                {"name": "BetweennessCentrality", "value": 100},
                                {"name": "LinkDistance", "value": 100},
                                {"name": "MaxFlowMinCut", "value": 100},
                                {"name": "ShortestPaths", "value": 100},
                                {"name": "SpanningTree", "value": 100}
                            ]
                        },
                        {
                            "name": "optimization",
                            "children": [
                                {"name": "AspectRatioBanker", "value": 100}
                            ]
                        }
                    ]
                },
                {
                    "name": "ANT2",
                    "children": [
                        {"name": "Easing", "value": 50},
                        {"name": "FunctionSequence", "value": 50},
                        {
                            "name": "Interpolate",
                            "children": [
                                {"name": "ArrayInterpolator", "value": 50},
                                {"name": "ColorInterpolator", "value": 50},
                                {"name": "DateInterpolator", "value": 50},
                                {"name": "Interpolator", "value": 50},
                                {"name": "MatrixInterpolator", "value": 50},
                                {"name": "NumberInterpolator", "value": 50},
                                {"name": "ObjectInterpolator", "value": 50},
                                {"name": "PointInterpolator", "value": 50},
                                {"name": "RectangleInterpolator", "value": 50}
                            ]
                        },
                        {"name": "ISchedulable", "value": 50},
                        {"name": "Parallel", "value": 50},
                        {"name": "Pause", "value": 50},
                        {"name": "Scheduler", "value": 50},
                        {"name": "Sequence", "value": 50},
                        {"name": "Transition", "value": 50},
                        {"name": "Transitioner", "value": 50},
                        {"name": "TransitionEvent", "value": 50},
                        {"name": "Tween", "value": 50}
                    ]
                },
                {
                    "name": "ANT3",
                    "children": [
                        {
                            "name": "converters",
                            "children": [
                                {"name": "Converters", "value": 100},
                                {"name": "DelimitedTextConverter", "value": 100},
                                {"name": "GraphMLConverter", "value": 100},
                                {"name": "IDataConverter", "value": 100},
                                {"name": "JSONConverter", "value": 100}
                            ]
                        },
                        {"name": "DataField", "value": 100},
                        {"name": "DataSchema", "value": 100},
                        {"name": "DataSet", "value": 100},
                        {"name": "DataSource", "value": 100},
                        {"name": "DataTable", "value": 100}
                    ]
                },
                {
                    "name": "ANT4",
                    "children": [
                        {"name": "DirtySprite", "value": 200},
                        {"name": "LineSprite", "value": 300},
                        {"name": "RectSprite", "value": 200},
                        {"name": "TextSprite", "value": 300}
                    ]
                },
                {
                    "name": "ANT5",
                    "children": [
                        {"name": "DragForce", "value": 100},
                        {"name": "GravityForce", "value": 100},
                        {"name": "IForce", "value": 100},
                        {"name": "NBodyForce", "value": 100},
                        {"name": "Particle", "value": 100},
                        {"name": "Simulation", "value": 100},
                        {"name": "Spring", "value": 100},
                        {"name": "SpringForce", "value": 300}
                    ]
                },
                {
                    "name": "ANT7",
                    "children": [
                        {"name": "AggregateExpression", "value": 25},
                        {"name": "And", "value": 25},
                        {"name": "Arithmetic", "value": 25},
                        {"name": "Average", "value": 25},
                        {"name": "BinaryExpression", "value": 25},
                        {"name": "Comparison", "value": 25},
                        {"name": "CompositeExpression", "value": 25},
                        {"name": "Count", "value": 25},
                        {"name": "DateUtil", "value": 25},
                        {"name": "Distinct", "value": 25},
                        {"name": "Expression", "value": 25},
                        {"name": "ExpressionIterator", "value": 25},
                        {"name": "Fn", "value": 25},
                        {"name": "If", "value": 25},
                        {"name": "IsA", "value": 25},
                        {"name": "Literal", "value": 25},
                        {"name": "Match", "value": 25},
                        {"name": "Maximum", "value": 25},
                        {
                            "name": "methods",
                            "children": [
                                {"name": "add", "value": 25},
                                {"name": "and", "value": 25},
                                {"name": "average", "value": 25},
                                {"name": "count", "value": 25},
                                {"name": "distinct", "value": 25},
                                {"name": "div", "value": 25},
                                {"name": "eq", "value": 25},
                                {"name": "fn", "value": 25},
                                {"name": "gt", "value": 25},
                                {"name": "gte", "value": 25},
                                {"name": "iff", "value": 25},
                                {"name": "isa", "value": 25}
                            ]
                        },
                        {"name": "Minimum", "value": 25},
                        {"name": "Not", "value": 25},
                        {"name": "Or", "value": 25},
                        {"name": "Query", "value": 25},
                        {"name": "Range", "value": 25},
                        {"name": "StringUtil", "value": 25},
                        {"name": "Sum", "value": 25},
                        {"name": "Variable", "value": 25},
                        {"name": "Variance", "value": 25},
                        {"name": "Xor", "value": 25}
                    ]
                },
                {
                    "name": "ANT6",
                    "children": [
                        {
                            "name": "axis",
                            "children": [
                                {"name": "Axes", "value": 100},
                                {"name": "Axis", "value": 100},
                                {"name": "AxisGridLine", "value": 100},
                                {"name": "AxisLabel", "value": 50},
                                {"name": "CartesianAxes", "value": 50}
                            ]
                        },
                        {
                            "name": "controls",
                            "children": [
                                {"name": "AnchorControl", "value": 100},
                                {"name": "ClickControl", "value": 50},
                                {"name": "Control", "value": 50},
                                {"name": "ControlList", "value": 50},
                                {"name": "DragControl", "value": 50},
                                {"name": "ExpandControl", "value": 50},
                                {"name": "HoverControl", "value": 50},
                                {"name": "IControl", "value": 50},
                                {"name": "PanZoomControl", "value": 50},
                                {"name": "SelectionControl", "value": 50},
                                {"name": "TooltipControl", "value": 50}
                            ]
                        }
                    ]
                },
                {
                    "name": "ANT9",
                    "children": [
                        {
                            "name": "axis",
                            "children": [
                                {"name": "Axes", "value": 100},
                                {"name": "Axis", "value": 100},
                                {"name": "AxisGridLine", "value": 100},
                                {"name": "AxisLabel", "value": 50},
                                {"name": "CartesianAxes", "value": 50}
                            ]
                        },
                        {
                            "name": "controls",
                            "children": [
                                {"name": "AnchorControl", "value": 100},
                                {"name": "ClickControl", "value": 50},
                                {"name": "Control", "value": 50},
                                {"name": "ControlList", "value": 50},
                                {"name": "DragControl", "value": 50},
                                {"name": "ExpandControl", "value": 50},
                                {"name": "HoverControl", "value": 50},
                                {"name": "IControl", "value": 50},
                                {"name": "PanZoomControl", "value": 50},
                                {"name": "SelectionControl", "value": 50},
                                {"name": "TooltipControl", "value": 50}
                            ]
                        }
                    ]
                },
                {
                    "name": "ANT8",
                    "children": [
                        {
                            "name": "axis",
                            "children": [
                                {"name": "Axes", "value": 100},
                                {"name": "Axis", "value": 100},
                                {"name": "AxisGridLine", "value": 100},
                                {"name": "AxisLabel", "value": 50},
                                {"name": "CartesianAxes", "value": 50}
                            ]
                        },
                        {
                            "name": "controls",
                            "children": [
                                {"name": "AnchorControl", "value": 100},
                                {"name": "ClickControl", "value": 50},
                                {"name": "Control", "value": 50},
                                {"name": "ControlList", "value": 50},
                                {"name": "DragControl", "value": 50},
                                {"name": "ExpandControl", "value": 50},
                                {"name": "HoverControl", "value": 50},
                                {"name": "IControl", "value": 50},
                                {"name": "PanZoomControl", "value": 50},
                                {"name": "SelectionControl", "value": 50},
                                {"name": "TooltipControl", "value": 50}
                            ]
                        }
                    ]
                }
            ]
        };
    });