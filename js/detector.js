
'use strict';

function initDetector() {
    const shapeAttributes = [
        {
            colorRange: [[175, 120, 40, 0], [5, 255, 255, 255]],
            color: 'red',
            numAngle: 3
        },
        {
            colorRange: [[100, 120, 40, 0], [130, 255, 255, 255]],
            color: 'blue',
            numAngle: 3
        },
        {
            colorRange: [[40, 100, 40, 0], [80, 255, 255, 255]],
            color: 'green',
            numAngle: 3
        },
        {
            colorRange: [[80, 100, 40, 0], [100, 255, 255, 255]],
            color: 'cyan',
            numAngle: 3
        },
        {
            colorRange: [[140, 80, 40, 0], [175, 255, 255, 255]],
            color: 'violet',
            numAngle: 3
        },
        {
            colorRange: [[20, 100, 40, 0], [40, 255, 255, 255]],
            color: 'yellow',
            numAngle: 4
        },
        {
            colorRange: [[5, 150, 40, 0], [15, 255, 255, 255]],
            color: 'orange',
            numAngle: 4
        },
    ]

    function findColorRegion(image, region, colorRange) {
        var reverseRange = colorRange[0].map((v, i) => v > colorRange[1][i]);
        if (reverseRange.some(v => v)) {
            var lower = colorRange[0].map((v, i) => reverseRange[i] ? 0 : v);
            var lowerMat = new cv.Mat(image.rows, image.cols, image.type(), lower);
            var upperMat = new cv.Mat(image.rows, image.cols, image.type(), colorRange[1]);
            var region1 = new cv.Mat();
            cv.inRange(image, lowerMat, upperMat, region1);
            lowerMat.delete();
            upperMat.delete();

            var upper = colorRange[1].map((v, i) => reverseRange[i] ? 255 : v);
            var lowerMat = new cv.Mat(image.rows, image.cols, image.type(), colorRange[0]);
            var upperMat = new cv.Mat(image.rows, image.cols, image.type(), upper);
            var region2 = new cv.Mat();
            cv.inRange(image, lowerMat, upperMat, region2);
            cv.bitwise_or(region1, region2, region);
            lowerMat.delete();
            upperMat.delete();
            region1.delete();
            region2.delete();
            return;
        }
        var lowerMat = new cv.Mat(image.rows, image.cols, image.type(), colorRange[0]);
        var upperMat = new cv.Mat(image.rows, image.cols, image.type(), colorRange[1]);
        cv.inRange(image, lowerMat, upperMat, region);
        lowerMat.delete();
        upperMat.delete();
    }

    function findShapes(image, colorRange, numAngle, approxEpsilon = 0.05) {
        var detectedShapes = [];
        var hsvImage = new cv.Mat();
        var region = new cv.Mat();
        var contours = new cv.MatVector();
        var hierarchy = new cv.Mat();
        var poly = new cv.MatVector();
        cv.cvtColor(image, hsvImage, cv.COLOR_RGBA2RGB, 0);
        cv.cvtColor(hsvImage, hsvImage, cv.COLOR_RGB2HSV, 0);
        findColorRegion(hsvImage, region, colorRange);
        cv.findContours(region, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        for (var i = 0; i < contours.size(); i++) {
            var approx = new cv.Mat();
            var cnt = contours.get(i);
            cv.approxPolyDP(cnt, approx, approxEpsilon * cv.arcLength(cnt, true), true);
            if (approx.rows === numAngle && cv.contourArea(approx) > 1000.0) {
                poly.push_back(approx);
                detectedShapes.push(approx);
            }
            // poly.push_back(approx);
            approx.delete();
            cnt.delete();
        }
        var color = new cv.Scalar(0, 0, 0, 0);
        cv.drawContours(image, poly, -1, color, 3, cv.LINE_8);
        hsvImage.delete();
        region.delete();
        contours.delete();
        hierarchy.delete();
        return detectedShapes;
    }

    function findAllShapes(image) {
        var shapes = [];
        for (var attr of shapeAttributes) {
            var s = findShapes(image, attr.colorRange, attr.numAngle);
            shapes.concat(s);
        }
        return shapes;
    }

    var detector = {};
    detector.findAllShapes = findAllShapes;
    window.detector = detector;
}
