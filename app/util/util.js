angular.module('katGui.util', [])
    .directive('resizer', resizer);

function resizer($document) {

    return function (scope, element, attrs) {

        element.on('mousedown', function (event) {
            event.preventDefault();

            //angular.element(attrs.resizerFlexParent).removeAttr('flex');
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });

        function mousemove(event) {

            if (attrs.resizer === 'vertical') {
                // Handle vertical resizer
                var x = window.innerWidth - event.pageX;
                angular.element(attrs.resizerTarget).css({
                    width: x + 'px'
                });

            } else {
                // Handle horizontal resizer

                var y = event.pageY - angular.element(attrs.resizerTarget).offset().top;

                angular.element(attrs.resizerTarget).css({
                    height: y - 8 + 'px'
                });
            }
        }

        function mouseup() {
            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
            //angular.element(attrs.resizerFlexParent).attr('flex');
        }
    };
}

var objToString = Object.prototype.toString;

_.isString = function (obj) {
    return objToString.call(obj) === '[object String]';
};
