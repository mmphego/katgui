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
                                {"name": "AgglomerativeCluster", "value": 1000},
                                {"name": "CommunityStructure", "value": 1000},
                                {"name": "HierarchicalCluster", "value": 1000},
                                {"name": "MergeEdge", "value": 1000}
                            ]
                        },
                        {
                            "name": "graph",
                            "children": [
                                {"name": "BetweennessCentrality", "value": 1000},
                                {"name": "LinkDistance", "value": 1000},
                                {"name": "MaxFlowMinCut", "value": 1000},
                                {"name": "ShortestPaths", "value": 1000},
                                {"name": "SpanningTree", "value": 1000}
                            ]
                        },
                        {
                            "name": "optimization",
                            "children": [
                                {"name": "AspectRatioBanker", "value": 1000}
                            ]
                        }
                    ]
                },
                {
                    "name": "ANT2",
                    "children": [
                        {"name": "Easing", "value": 500},
                        {"name": "FunctionSequence", "value": 500},
                        {
                            "name": "Interpolate",
                            "children": [
                                {"name": "ArrayInterpolator", "value": 500},
                                {"name": "ColorInterpolator", "value": 500},
                                {"name": "DateInterpolator", "value": 500},
                                {"name": "Interpolator", "value": 500},
                                {"name": "MatrixInterpolator", "value": 500},
                                {"name": "NumberInterpolator", "value": 500},
                                {"name": "ObjectInterpolator", "value": 500},
                                {"name": "PointInterpolator", "value": 500},
                                {"name": "RectangleInterpolator", "value": 500}
                            ]
                        },
                        {"name": "ISchedulable", "value": 500},
                        {"name": "Parallel", "value": 500},
                        {"name": "Pause", "value": 500},
                        {"name": "Scheduler", "value": 500},
                        {"name": "Sequence", "value": 500},
                        {"name": "Transition", "value": 500},
                        {"name": "Transitioner", "value": 500},
                        {"name": "TransitionEvent", "value": 500},
                        {"name": "Tween", "value": 500}
                    ]
                },
                {
                    "name": "ANT3",
                    "children": [
                        {
                            "name": "converters",
                            "children": [
                                {"name": "Converters", "value": 1000},
                                {"name": "DelimitedTextConverter", "value": 1000},
                                {"name": "GraphMLConverter", "value": 1000},
                                {"name": "IDataConverter", "value": 1000},
                                {"name": "JSONConverter", "value": 1000}
                            ]
                        },
                        {"name": "DataField", "value": 1000},
                        {"name": "DataSchema", "value": 1000},
                        {"name": "DataSet", "value": 1000},
                        {"name": "DataSource", "value": 1000},
                        {"name": "DataTable", "value": 1000}
                    ]
                },
                {
                    "name": "ANT4",
                    "children": [
                        {"name": "DirtySprite", "value": 2000},
                        {"name": "LineSprite", "value": 3000},
                        {"name": "RectSprite", "value": 2000},
                        {"name": "TextSprite", "value": 3000}
                    ]
                },
                {
                    "name": "ANT5",
                    "children": [
                        {"name": "DragForce", "value": 1000},
                        {"name": "GravityForce", "value": 1000},
                        {"name": "IForce", "value": 1000},
                        {"name": "NBodyForce", "value": 1000},
                        {"name": "Particle", "value": 1000},
                        {"name": "Simulation", "value": 1000},
                        {"name": "Spring", "value": 1000},
                        {"name": "SpringForce", "value": 3000}
                    ]
                },
                {
                    "name": "ANT7",
                    "children": [
                        {"name": "AggregateExpression", "value": 250},
                        {"name": "And", "value": 250},
                        {"name": "Arithmetic", "value": 250},
                        {"name": "Average", "value": 250},
                        {"name": "BinaryExpression", "value": 250},
                        {"name": "Comparison", "value": 250},
                        {"name": "CompositeExpression", "value": 250},
                        {"name": "Count", "value": 250},
                        {"name": "DateUtil", "value": 250},
                        {"name": "Distinct", "value": 250},
                        {"name": "Expression", "value": 250},
                        {"name": "ExpressionIterator", "value": 250},
                        {"name": "Fn", "value": 250},
                        {"name": "If", "value": 250},
                        {"name": "IsA", "value": 250},
                        {"name": "Literal", "value": 250},
                        {"name": "Match", "value": 250},
                        {"name": "Maximum", "value": 250},
                        {
                            "name": "methods",
                            "children": [
                                {"name": "add", "value": 250},
                                {"name": "and", "value": 250},
                                {"name": "average", "value": 250},
                                {"name": "count", "value": 250},
                                {"name": "distinct", "value": 250},
                                {"name": "div", "value": 250},
                                {"name": "eq", "value": 250},
                                {"name": "fn", "value": 250},
                                {"name": "gt", "value": 250},
                                {"name": "gte", "value": 250},
                                {"name": "iff", "value": 250},
                                {"name": "isa", "value": 250}
                            ]
                        },
                        {"name": "Minimum", "value": 250},
                        {"name": "Not", "value": 250},
                        {"name": "Or", "value": 250},
                        {"name": "Query", "value": 250},
                        {"name": "Range", "value": 250},
                        {"name": "StringUtil", "value": 250},
                        {"name": "Sum", "value": 250},
                        {"name": "Variable", "value": 250},
                        {"name": "Variance", "value": 250},
                        {"name": "Xor", "value": 250}
                    ]
                },
                {
                    "name": "ANT6",
                    "children": [
                        {
                            "name": "axis",
                            "children": [
                                {"name": "Axes", "value": 1000},
                                {"name": "Axis", "value": 1000},
                                {"name": "AxisGridLine", "value": 1000},
                                {"name": "AxisLabel", "value": 500},
                                {"name": "CartesianAxes", "value": 500}
                            ]
                        },
                        {
                            "name": "controls",
                            "children": [
                                {"name": "AnchorControl", "value": 1000},
                                {"name": "ClickControl", "value": 500},
                                {"name": "Control", "value": 500},
                                {"name": "ControlList", "value": 500},
                                {"name": "DragControl", "value": 500},
                                {"name": "ExpandControl", "value": 500},
                                {"name": "HoverControl", "value": 500},
                                {"name": "IControl", "value": 500},
                                {"name": "PanZoomControl", "value": 500},
                                {"name": "SelectionControl", "value": 500},
                                {"name": "TooltipControl", "value": 500}
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
                                {"name": "Axes", "value": 1000},
                                {"name": "Axis", "value": 1000},
                                {"name": "AxisGridLine", "value": 1000},
                                {"name": "AxisLabel", "value": 500},
                                {"name": "CartesianAxes", "value": 500}
                            ]
                        },
                        {
                            "name": "controls",
                            "children": [
                                {"name": "AnchorControl", "value": 1000},
                                {"name": "ClickControl", "value": 500},
                                {"name": "Control", "value": 500},
                                {"name": "ControlList", "value": 500},
                                {"name": "DragControl", "value": 500},
                                {"name": "ExpandControl", "value": 500},
                                {"name": "HoverControl", "value": 500},
                                {"name": "IControl", "value": 500},
                                {"name": "PanZoomControl", "value": 500},
                                {"name": "SelectionControl", "value": 500},
                                {"name": "TooltipControl", "value": 500}
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
                                {"name": "Axes", "value": 1000},
                                {"name": "Axis", "value": 1000},
                                {"name": "AxisGridLine", "value": 1000},
                                {"name": "AxisLabel", "value": 500},
                                {"name": "CartesianAxes", "value": 500}
                            ]
                        },
                        {
                            "name": "controls",
                            "children": [
                                {"name": "AnchorControl", "value": 1000},
                                {"name": "ClickControl", "value": 500},
                                {"name": "Control", "value": 500},
                                {"name": "ControlList", "value": 500},
                                {"name": "DragControl", "value": 500},
                                {"name": "ExpandControl", "value": 500},
                                {"name": "HoverControl", "value": 500},
                                {"name": "IControl", "value": 500},
                                {"name": "PanZoomControl", "value": 500},
                                {"name": "SelectionControl", "value": 500},
                                {"name": "TooltipControl", "value": 500}
                            ]
                        }
                    ]
                }
            ]
        };
    });