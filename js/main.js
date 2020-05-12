/*
Copyright 2017 Google Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

function main() {
    var videoElement = document.querySelector('video');
    var videoSelect = document.querySelector('select#videoSource');
    var canvasElement = document.querySelector('canvas');
    var context = canvasElement.getContext('2d');

    videoSelect.onchange = getStream;

    getStream().then(getDevices).then(gotDevices);

    videoElement.addEventListener('loadedmetadata', initCanvas, false);
    videoElement.addEventListener('play', drawFrame, false);

    function getDevices() {
        // AFAICT in Safari this only gets default devices until gUM is called :/
        return navigator.mediaDevices.enumerateDevices();
    }

    function gotDevices(deviceInfos) {
        window.deviceInfos = deviceInfos; // make available to console
        console.log('Available input and output devices:', deviceInfos);
        for (const deviceInfo of deviceInfos) {
            const option = document.createElement('option');
            option.value = deviceInfo.deviceId;
            if (deviceInfo.kind === 'videoinput') {
                option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
                videoSelect.appendChild(option);
            }
        }
    }

    function getStream() {
        if (window.stream) {
            window.stream.getTracks().forEach(track => {
                track.stop();
            });
        }
        const videoSource = videoSelect.value;
        const constraints = {
            video: {deviceId: videoSource ? {exact: videoSource} : undefined}
        };
        return navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
    }

    function gotStream(stream) {
        window.stream = stream; // make stream available to console
        videoSelect.selectedIndex = [...videoSelect.options].findIndex(option => option.text === stream.getVideoTracks()[0].label);
        videoElement.srcObject = stream;
    }

    function handleError(error) {
        console.error('Error: ', error);
    }

    function initCanvas(e) {
        canvasElement.width = this.videoWidth;
        canvasElement.height = this.videoHeight;
        this.width = this.videoWidth;
        this.height = this.videoHeight;
        window.cvImage = new cv.Mat(this.videoHeight, this.videoWidth, cv.CV_8UC4);
        window.videoCapture = new cv.VideoCapture(this);
    }

    function drawFrame(e) {
        var $this = this;
        (function loop() {
            if (!$this.paused && !$this.ended) {
                videoCapture.read(cvImage);
                var shapes = detector.findAllShapes(cvImage);
                cv.imshow(canvasElement, cvImage);
                // context.drawImage($this, 0, 0, canvasElement.width, canvasElement.height);
                // console.log(cv.imread(canvasElement));
                setTimeout(loop, 1000 / 30);
            }
        })();
    }
}

function onOpenCvReady() {
    cv['onRuntimeInitialized'] = function () {
        console.log('ready');
        initDetector();
        main();
    };
}