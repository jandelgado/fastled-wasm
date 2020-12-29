// FastLED WASM Demo - Javascript RGB LED Matrix
// (c) copyright 2020 Jan Delgado
var LED = (function() {
    const WIDTH_MATRIX = 75;
    const SIZE_MATRIX = 8;
    const NUM = SIZE_MATRIX * SIZE_MATRIX;
    const MARGIN = 1;
    let demoName = "demo_reel100";  // demo_pride

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

    // given a rgb byte array, return an array of RGB objects
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

    function drawMatrix(ctx, rgbs, width, height, cols, rows, mapper) {
        const fontSize = 12;
        ctx.font = `${fontSize}px Arial`;
        for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                const i = mapper(col, row, cols, rows);
                if (i >= rgbs.length) {
                    continue;
                }

                const color = rgbs[i];

                ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                ctx.fillRect( col * width + MARGIN, row * height + MARGIN,
                              width - 2 * MARGIN, height - 2 * MARGIN);

                if (width > fontSize) {
                    ctx.fillStyle = "white";
                    ctx.fillText( `${i}`, col * width + 1, row * height + fontSize);
                }
            }
        }
    }

    function mapLinear(x, y, cols, rows) {
        return y * rows + x;
    }

    function mapSnake(x, y, cols, rows) {
        if (y & 1) {
            return y * rows + (cols - 1) - x;
        } else {
            return y * rows + x;
        }
    }

    function getClientRect(elem) {
        const style = window.getComputedStyle(root);
        let [padLeft, padRight] = [
            parseInt(style.paddingLeft),
            parseInt(style.paddingRight)
        ];
        const [widthAvail, heightAvail] = [
            root.clientWidth - (padLeft + padRight), root.clientHeight ];
        const width = Math.floor(widthAvail / NUM);
        return [widthAvail, heightAvail];
    }

    function onresize() {
        console.log("resized");

        const root = document.getElementById("root");
        const [widthAvail, heightAvail] = getClientRect(root);

        // stripe
        const canvas2 = document.getElementById("led2");
        const width = Math.floor(widthAvail / NUM);
        canvas2.width = width * NUM;
        const height = width; // squares
        canvas2.height = height;

        // square
        const canvas1 = document.getElementById("led1");
        const r = canvas1.getBoundingClientRect();
        const remain = Math.min(heightAvail - canvas2.height + MARGIN, widthAvail);
        canvas1.width = Math.floor(remain / NUM) * NUM;
        canvas1.height = canvas1.width;
        console.log( "heightAvail=", heightAvail-r.top, "r.top=", canvas1.offsetTop, "REMAIN=", remain, "width=", canvas1.width, "height=", canvas1.height);
    }

    // returns the WASM FastLED demofunc to run
    function getDemoFunc(name) {
        return Module.cwrap(name, "void", ["number", "number"]);
    }

    function start() {
        const root = document.getElementById("root");
        const [widthAvail, heightAvail] = getClientRect(root);
        const width = Math.floor(widthAvail / NUM);

        const canvas2 = createCanvas("led2", width * NUM, width, root);
        const canvas1 = createCanvas( "led1", WIDTH_MATRIX * SIZE_MATRIX, WIDTH_MATRIX * SIZE_MATRIX, root);
        onresize();

        const ctx1 = canvas1.getContext("2d");
        const ctx2 = canvas2.getContext("2d");

        const numLeds = NUM;

        // array storing (r,g,b) byte tuples per LED
        const data = new Uint8Array(new Array(3 * numLeds).fill(0));

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

        let start;
        function step(timestamp) {
            if (start === undefined) start = timestamp;
            const elapsed = timestamp - start;

            // Call FastLED function and get result
            const demo = getDemoFunc(demoName);
            demo(elapsed, dataHeap.byteOffset, data.length);

            const result = new Uint8Array(
                dataHeap.buffer,
                dataHeap.byteOffset,
                data.length
            );
            const rgbs = byteArrayToRGB(result);

            // square
            const width = canvas1.width / SIZE_MATRIX;
            drawMatrix( ctx1, rgbs, width, width, SIZE_MATRIX, SIZE_MATRIX, mapSnake);
            // stripe
            const widthStripe = canvas2.width / NUM;
            drawMatrix(ctx2, rgbs, widthStripe, widthStripe, NUM, 1, mapLinear);

            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);

        // Free memory
        Module._free(dataHeap.byteOffset);
    }

    function demo(name) {
        demoName = name;
    }

    return {
        start: start,
        onresize: onresize,
        demo: demo,
    };
})();
