angular.module('katGui.util')

    .directive('inlineEdit', function () {
        return {
            link: function (scope, element) {

                element.bind('keydown', function (event) {

                    if (event.which === 27) {
                        event.target.blur();
                        event.preventDefault();
                    }

                });

                element.bind('click', function () {

//                    if (element.hasClass('inactive-text-input')) {
//                        $(element).blur();
//                    } else {
                        this.select();
//                    }
                });

            }
        };
    });