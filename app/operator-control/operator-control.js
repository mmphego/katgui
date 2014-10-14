angular.module('katGui')

    .controller('OperatorControlCtrl', function ($scope) {

        $scope.title = 'Operator Controls';

        //test data
        $scope.receptorsData = [
            {
                name: "ant1",
                state: "STOW",
                inhibited: false
            },
            {
                name: "ant2",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant3",
                state: "STOW",
                inhibited: false
            },
            {
                name: "ant4",
                state: "STOW",
                inhibited: false
            },
            {
                name: "ant5",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant6",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant7",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant8",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant9",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant10",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant11",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant12",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant13",
                state: "STOW",
                inhibited: true
            },
            {
                name: "ant14",
                state: "STOW",
                inhibited: true
            }
        ];


        $scope.receptors = [];

        var maxCols = 8;
        var maxRows = 8;
        var counter = 0;
        var dataLength = $scope.receptorsData.length;

        for (var i = 0; i < maxRows; i++) {
            $scope.receptors.push([]);
            for (var j = 0; j < maxCols; j++) {
                if (counter < dataLength) {
                    var obj = {id: counter, receptor: $scope.receptorsData[counter]};
                    $scope.receptors[i][j] = obj;
                    counter++;
                } else {
                    break;
                }
            }
            if (counter >= dataLength) {
                break;
            }
        }
    });