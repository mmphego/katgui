(function () {

    angular.module('katGui.services')
        .service('SoundService', SoundService);

    function SoundService ($rootScope, $log, $localStorage) {

        var api = {};
        var myAudioContext, myBuffers = {}, bufferLoader;

        api.init = function () {
            if ('AudioContext' in window) {
                myAudioContext = new AudioContext();
                api.fetchSounds();
            }
        };

        api.fetchSounds = function () {

            bufferLoader = new BufferLoader(
                myAudioContext,
                [
                    'sounds/alarm.mp3',
                    'sounds/beep.mp3',
                    'sounds/critical.mp3'
                ],
                finishedLoading
            );
            bufferLoader.load();
        };

        function finishedLoading(bufferList) {
            myBuffers['alarm'] = bufferList[0];
            myBuffers['beep'] = bufferList[1];
            myBuffers['critical'] = bufferList[2];
        }

        api.playAlarm = function () {
            api.playSound('alarm');
        };

        api.playBeep = function () {
            api.playSound('beep');
        };

        api.playCriticalAlarm = function () {
            api.playSound('critical');
        };

        api.playSound = function (key) {
            if (!$rootScope.disableAlarmSounds && myBuffers[key] && myAudioContext) {
                var source = myAudioContext.createBufferSource();
                source.buffer = myBuffers[key];
                source.loop = false;
                source.connect(myAudioContext.destination);
                source.start(0);
            }
        };

        //Buffer loader class start
        function BufferLoader(context, urlList, callback) {
            this.context = context;
            this.urlList = urlList;
            this.onload = callback;
            this.bufferList = [];
            this.loadCount = 0;
        }

        BufferLoader.prototype.loadBuffer = function(url, index) {
            // Load buffer asynchronously
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";

            var loader = this;

            request.onload = function() {
                // Asynchronously decode the audio file data in request.response
                loader.context.decodeAudioData(
                    request.response,
                    function(buffer) {
                        if (!buffer) {
                            $log.error('error decoding file data: ' + url);
                            return;
                        }
                        loader.bufferList[index] = buffer;
                        if (++loader.loadCount == loader.urlList.length)
                            loader.onload(loader.bufferList);
                    },
                    function(error) {
                        $log.error('decodeAudioData error', error);
                    }
                );
            };

            request.onerror = function() {
                $log.error('BufferLoader: XHR error');
            };

            request.send();
        };

        BufferLoader.prototype.load = function() {
            for (var i = 0; i < this.urlList.length; ++i)
                this.loadBuffer(this.urlList[i], i);
        };
        //Buffer loader class end

        return api;
    }
})();





