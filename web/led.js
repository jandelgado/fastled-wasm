// FastLED WASM Demo - Javascript RGB LED Matrix
// (c) copyright 2020 Jan Delgado
var LED = (function() {
    const MARGIN = 1;

    let _demoName = "demo_reel100";  // demo_pride
    let _cols, _rows;
    let _animationId;
    let _showNumbers = true;
    let _dataHeap;

    function createCanvas(id, width, height, parent) {
        let canvas = document.createElement("canvas");
        canvas.id = id;
        canvas.width = width;
        canvas.height = height;
        //canvas.style.zIndex = 8;
        //canvas.style.position = "absolute";
        canvas.style.border = "1px solid #a0a0a0";
        parent.appendChild(canvas);
        return canvas;
    }

    // given a rgb byte array, return an array of RGB objects [ {r: , g:, b:}..]
    function byteArrayToRGB(rgbbuf) {
        rgbs = [];
        const num_leds = Math.floor(rgbbuf.length / 3);
        for (let i = 0; i < num_leds; i++) {
            rgbs.push({
                r: rgbbuf[i * 3],
                g: rgbbuf[i * 3 + 1],
                b: rgbbuf[i * 3 + 2]
            });
        }
        return rgbs;
    }

    function drawMatrix(ctx, rgbs, size, cols, rows, mapper) {
        const fontSize = 10;
        const margin = (size <= 4 ) ? 0 : MARGIN;
        ctx.font = `${fontSize}px Arial`;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const i = mapper(col, row, cols, rows);
                if (i >= rgbs.length) {
                    continue;
                }

                const color = rgbs[i];
                ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                ctx.fillRect( col*size + margin, 
                              row*size + margin,
                              size - 2*margin + 1, 
                              size - 2*margin + 1);

                if (_showNumbers && size >= fontSize*1.5) {
                    ctx.fillStyle = "white";
                    ctx.fillText( `${i}`, col*size + 1, row*size + fontSize);
                }
            }
        }
    }

    function mapLinear(x, y, cols, rows) {
        return y * rows + x;
    }

    function mapSnake(x, y, cols, rows) {
        if (y & 1) {
            return y*cols + (cols - 1) - x;
        } else {
            return y*cols + x;
        }
    }

    function getClientRect(elem) {
        const style = window.getComputedStyle(elem);
        let [padLeft, padRight, padTop, padBottom] = [
            parseInt(style.paddingLeft),
            parseInt(style.paddingRight),
            parseInt(style.paddingTop),
            parseInt(style.paddingBottom)
        ];
        const [widthAvail, heightAvail] = [
            elem.clientWidth - (padLeft + padRight), 
            elem.clientHeight- (padTop + padBottom) ];
        return [widthAvail, heightAvail];
    }

    // resize elem in its parent to display maximum size of cols*rows 'LED's
    function resize(elem, cols, rows) {
        const container = elem.parentNode; 
        const [widthAvail, heightAvail] = getClientRect(container);
        const sizeLed = Math.floor(Math.min(heightAvail/rows, widthAvail/cols));
        //const sizeLed = Math.max(1, Math.min(heightAvail/rows, widthAvail/cols));
        elem.width =  sizeLed * cols;
        elem.height = sizeLed * rows;
    }

    function onresize() {
        console.log("resized");
        const canvasStripe = document.getElementById("ledstripe");
        resize(canvasStripe, _cols*_rows, 1);
        const canvasMatrix = document.getElementById("ledmatrix");
        resize(canvasMatrix, _cols, _rows);
    }

    // returns the WASM FastLED function to run by name
    function getDemoFunc(name) {
        return Module.cwrap(name, "void", ["number", "number", "number"]);
    }

    function prepareHeap(numLeds) {
        // array storing (r,g,b) byte tuples per LED
        const data = new Uint8Array(new Array(3*numLeds).fill(0));

        // Get data byte size, allocate memory on Emscripten heap, and get pointer
        const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
        const dataPtr = Module._malloc(nDataBytes);

        // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
        const dataHeap = new Uint8Array(
            Module.HEAPU8.buffer,
            dataPtr,
            nDataBytes
        );
        dataHeap.set(new Uint8Array(data.buffer));
        return dataHeap;
    }

    function animate() {
        
        const canvasMatrix = document.getElementById("ledmatrix");
        const canvasStripe = document.getElementById("ledstripe");
        const ctxMatrix = canvasMatrix.getContext("2d");
        const ctxStripe = canvasStripe.getContext("2d");
        const numLeds = _cols*_rows;
        if (_dataHeap) {
            Module._free(_dataHeap.byteOffset);   
        }

        _dataHeap = prepareHeap(numLeds);

        let start;
        function step(timestamp) {
            if (start === undefined) start = timestamp;
            const elapsed = timestamp - start;

            // Call FastLED function and get result as RGB tuples
            const demoFunc = getDemoFunc(_demoName);
            demoFunc(elapsed, _dataHeap.byteOffset, numLeds);
            const rgbs = byteArrayToRGB(_dataHeap);

            // draw matrix with actual size of canvas  TODO function
            const size  = Math.min(canvasMatrix.width / _cols, canvasMatrix.height / _rows);
            drawMatrix(ctxMatrix, rgbs, size , _cols, _rows, mapSnake);

            // and stripe ...
            const sizeStripe = canvasStripe.width / numLeds;
            drawMatrix(ctxStripe, rgbs, sizeStripe, numLeds, 1, mapLinear);

            _animationId = window.requestAnimationFrame(step);
        }
        _animationId = window.requestAnimationFrame(step);
    }

    function start(cols, rows) {
        [_cols, _rows] = [cols, rows];
        onresize();
        animate();
    }

    function stopAnimation() {
        if (_animationId) {
            window.cancelAnimationFrame(_animationId);
            _animationId = undefined;
        }
    }

    function setSize(cols, rows) {
        stopAnimation();
        start(cols, rows);
    }

    function setDemo(name) {
        _demoName = name;
    }

    function toggleNumbers() {
        _showNumbers = !_showNumbers;
    }

    return {
        setSize: setSize,
        start: start,
        onresize: onresize,
        toggleNumbers: toggleNumbers,
        setDemo: setDemo,
    };
})();
