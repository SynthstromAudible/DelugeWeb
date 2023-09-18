/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/app.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/app.js":
/*!********************!*\
  !*** ./src/app.js ***!
  \********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib.js */ "./src/lib.js");


/** @type {MIDIAccess} */
let midi = null;
/** @type {MIDIInput} */
let delugeIn = null;
/** @type {MIDIOutput} */
let delugeOut = null;
let theInterval = null;

let did_oled = false;

let lib = null;
Object(_lib_js__WEBPACK_IMPORTED_MODULE_0__["loadlib"])(function(l) {
  lib = l;
  window.lib = l;
})


function $(name) {
  return document.getElementById(name)
}

function setstatus(text) {
  $("midiStatus").innerText = text
}

function setInput(input) {
  if (delugeIn == input) {
    return;
  }
  if (delugeIn != null) {
    delugeIn.removeEventListener("midimessage", handleData);
  }
  delugeIn = input;
  if (input != null) {
    input.addEventListener("midimessage", handleData);
  }
}

function populateDevices() {
  for (const entry of midi.inputs) {
    const port = entry[1];
    const opt = new Option(port.name, port.id);
    $("chooseIn").appendChild(opt);
    if (port.name.includes("Deluge MIDI 3")) {
      opt.selected = true;
      setInput(port);
    }
  }
  for (const entry of midi.outputs) {
    const port = entry[1];
    const opt = new Option(port.name, port.id);
    $("chooseOut").appendChild(opt);
    if (port.name.includes("Deluge MIDI 3")) {
      opt.selected = true;
      delugeOut = port;
    }
  }
}

function onChangeIn(ev) {
  const id = ev.target.value;
  setInput(midi.inputs.get(id))
}

function onChangeOut(ev) {
  const id = ev.target.value;
  console.log("choose the id:" + id)
  delugeOut = midi.outputs.get(id) || null;
  console.log("choose the port:" + delugeOut)
}

function onStateChange(ev) {
  const port = ev.port;
  const delet = (port.state == "disconnected");
  if (port.type == "input") {
    let found = false;
    let children = $("chooseIn").childNodes;
    for (let i=0; i < children.length; i++) {
      if (children[i].value == port.id) {
        found = true;
        if (delet) {
          children[i].remove();
          if (port == delugeIn) {
            $("noneInput").selected = true;
            // or maybe not, if id: are preserved during a disconnect/connect cycle
            setInput(null);
          }
          break;
        }
      }
    }
    if (!found && !delet) {
      const opt = new Option(port.name, port.id);
      $("chooseIn").appendChild(opt);
    }
  } else {
    let found = false;
    let children = $("chooseOut").childNodes;
    for (let i=0; i < children.length; i++) {
      if (children[i].value == port.id) {
        found = true;
        if (delet) {
          children[i].remove();
          if (port == delugeOut) {
            $("noneOutput").selected = true;
            // or maybe not, if id: are preserved during a disconnect/connect cycle
            delugeOut = null;
          }
          break;
        }
      }
    }
    if (!found && !delet) {
      const opt = new Option(port.name, port.id);
      $("chooseOut").appendChild(opt);
    }
  }
}

function onMIDISuccess(midiAccess) {
  setstatus("webmidi ready");
  midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
  populateDevices()
  midi.addEventListener("statechange", onStateChange)
}

function onMIDIFailure(msg) {
  setstatus(`Failed to get MIDI access :( - ${msg}`);
}

window.addEventListener('load', function() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then( onMIDISuccess, onMIDIFailure );
  } else {
    setstatus("webmidi unavail, check browser permissions");
  }

  $("pingButton").addEventListener("click", pingTest)
  $("getOledButton").addEventListener("click", getOled)
  $("get7segButton").addEventListener("click", get7seg)
  $("flipButton").addEventListener("click", flipscreen)
  $("getDebugButton").addEventListener("click", getDebug)
  $("intervalButton").addEventListener("click", setRefresh)
  $("testDecodeButton").addEventListener("click", () => decode(testdata))
  $("test7segButton").addEventListener("click", () => draw7Seg([47,3,8,19], 3))

  $("chooseIn").addEventListener("change", onChangeIn)
  $("chooseOut").addEventListener("change", onChangeOut)
  return;
});


function pingTest() {
    delugeOut.send([0xf0, 0x7d, 0x00, 0xf7]);
}

function oldCodes() {
   for (const entry of midi.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`,
    );
  }

  for (const entry of midi.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
}

function getOled() {
    delugeOut.send([0xf0, 0x7d, 0x02, 0x00, 0x01, 0xf7]);
}

function get7seg() {
    delugeOut.send([0xf0, 0x7d, 0x02, 0x01, 0x00, 0xf7]);
}

function getDisplay(force) {
    delugeOut.send([0xf0, 0x7d, 0x02, 0x00, force ? 0x03 : 0x02, 0xf7]);
}

function getDebug() {
    delugeOut.send([0xf0, 0x7d, 0x03, 0x00, 0x01, 0xf7]);
}

function flipscreen() {
    delugeOut.send([0xf0, 0x7d, 0x02, 0x00, 0x04, 0xf7]);
}

function setRefresh() {
  if (theInterval != null) {
    clearInterval(theInterval)
    theInterval = null;
  }

  theInterval = setInterval(function() { getDisplay(false); }, 1000);
  getDisplay(true);
}

let lastmsg

/** @param {MIDIMessageEvent} msg */
function handleData(msg) {
  lastmsg = msg
  // console.log(msg.data);
  if (msg.data.length > 8) {
    $("dataLog").innerText = "size: " + msg.data.length
  }
  decode(msg.data)
}

/** @param {Uint8Array} data */
function decode(data) {
  if (data.length < 3 || data[0] != 0xf0 || data[1] != 0x7d) {
    console.log("foreign sysex?")
    return;
  }

  if (data.length >= 5 && data[2] == 0x02 && data[3] == 0x40) {
    // console.log("found OLED!")

    if (data[4] == 1) {
      drawOled(data)
    } else if (data[4] == 2) {
      drawOledDelta(data)
    } else {
      console.log("DO NOT DO THAT")
    }

  } else if (data.length >= 5 && data[2] == 0x02 && data[3] == 0x41) {
    console.log("found 7seg!")

    if (data[4] != 0) {
      console.log("DO NOT DO THAT")
      return;
    }

    draw7Seg(data.subarray(7,11), data[6])
  } else if (data.length >= 5 && data[2] == 0x03 && data[3] == 0x40) {
    console.log("found debug!")
    // data[4]: unused category

    let msgbuf = data.subarray(5, data.length-1);
    let message = new TextDecoder().decode(msgbuf)
    let chunks = message.split('\n')
    for (let i = 0; i < chunks.length; i++) {
      $('debugOutput').insertAdjacentText('beforeend', chunks[i])
      if (i < chunks.length-1) {
        $('debugOutput').insertAdjacentElement('beforeend', document.createElement("br"));
      }
    }
  }
}

let oledData = new Uint8Array(6*128);

function drawOled(data) {
  let packed = data.subarray(6,data.length-1)

  let unpacked = lib.wrap_array(lib.fn.unpack_7to8_rle, packed)
  console.log(`reset ${unpacked.length} as ${packed.length}`);

  if (unpacked.length == oledData.length) {
    oledData = unpacked;
  }
  drawOleddata(unpacked);
}

function drawOledDelta(data) {

  let first = data[5];
  let len = data[6];
  let packed = data.subarray(7,data.length-1)
  //console.log("packed size "+ packed.length);

  let unpacked = lib.wrap_array(lib.fn.unpack_7to8_rle, packed)
  console.log(`first ${first}, len ${len}, delta size ${unpacked.length} as ${packed.length}`);

  oledData.subarray(8*first,8*(first+len)).set(unpacked)
  drawOleddata(oledData);
}

let offx = 10;
let offy = 5;

function drawOleddata(data) {
  /** @type {CanvasRenderingContext2D} */
  let ctx = $("screenCanvas").getContext("2d")

  let px_height = 5;
  let px_width = 5;
  let indist = 0.5;

  let blk_width = 128;
  ctx.fillStyle = "#111111";
  ctx.fillRect(offx,offy,px_width*128,px_height*48)
  did_oled = true;

  ctx.fillStyle = "#eeeeee";
  for (let blk = 0; blk < 6; blk++) {
    for (let rstride = 0; rstride < 8; rstride++) {
      let mask = 1 << (rstride);
      for (let j = 0; j < blk_width; j++) {
        if ((blk*blk_width+j) > data.length) {
          break;
        }
        let idata = (data[blk*blk_width+j] & mask);

        let y = blk*8 + rstride;

        if (idata > 0) {
          ctx.fillRect(offx+j*px_width+indist,offy+y*px_height+indist, px_width-2*indist, px_height-2*indist);
        }

      }
    }
  }
}

function draw7Seg(digits, dots) {
  /** @type {CanvasRenderingContext2D} */
  let ctx = $("screenCanvas").getContext("2d")

  ctx.fillStyle = "#111111";
  if (did_oled) {
    ctx.fillRect(offx,offy,5*128,5*48)
    did_oled = false;
  } else {
    ctx.fillRect(offx,offy,310,140)
  }

  let digit_height = 120;
  let digit_width = 60;
  let stroke_thick = 9;
  let half_height = digit_height/2;
  let out_adj = 0.5;
  let in_adj = 1.5;

  let off_y = offy + 6;

  let topbot = [[out_adj,0],[stroke_thick+in_adj, stroke_thick],[digit_width-(stroke_thick+in_adj), stroke_thick], [digit_width-out_adj, 0]];
  let halfside = [[0,out_adj],[stroke_thick, stroke_thick+in_adj],[stroke_thick, half_height-stroke_thick*0.5-in_adj], [0, half_height-out_adj]];
  let h = half_height;
  let ht = stroke_thick;
  let hta = stroke_thick/2//-in_adj/2;
  let midline = [
    [out_adj,h],[ht,h-hta], [digit_width-ht,h-hta],
    [digit_width-out_adj, h], [digit_width-ht,h+hta], [ht,h+hta]
  ];

  for (let d = 0; d < 4; d++) {
    let digit = digits[d];
    let dot = (dots & (1 << d)) != 0;

    let off_x = offx + 8 + (13+digit_width)*d;

    for (let s = 0; s < 7; s++) {
      ctx.beginPath()
      let path;
      if (s == 0) { path = midline; }
      else if (s == 3 || s == 6) { path = topbot; }
      else  { path = halfside; }
      for (let i = 0; i < path.length; i++) {
        let c = path[i];
        if (s == 2 || s == 3 || s == 4 ) { c = [c[0], digit_height-c[1]]; } // flip horiz
        if (s == 4 || s == 5) { c = [digit_width-c[0], c[1]]; } // flip vert
        if (i == 0) {
          ctx.moveTo(off_x+c[0], off_y+c[1]);
        } else {
          ctx.lineTo(off_x+c[0], off_y+c[1]);
        }
      }

      ctx.closePath()

      if (digit & (1<<s)) { 
        ctx.fillStyle = "#CC3333";
      } else {
        ctx.fillStyle = "#331111";
      }
      ctx.fill()
    }

    // the dot
    ctx.beginPath()
    ctx.rect(off_x+digit_width+3, off_y+digit_height+3, 6.5, 6.5);
    if (dot) {
      ctx.fillStyle = "#CC3333";
    } else {
      ctx.fillStyle = "#331111";
    }
    ctx.fill()
  }
}

let testdata = new Uint8Array([
    240, 125, 2, 64, 1, 0, 126, 127, 0, 102, 0, 66, 76, 71, 18, 44, 100, 0, 6, 8, 112, 36, 8, 6, 0, 126, 8, 16, 16, 32, 126, 0, 68, 2, 67, 126, 68, 2, 2, 0, 126, 70, 16, 67, 126, 126, 127, 0, 114, 0, 71, 64, 72, 0, 69, 124, 68, 108, 3, 124, 120, 68, 0, 67, 96, 69, 120, 70, 12, 69, 120, 57, 96, 0, 0, 112, 124, 27, 28, 124, 112, 0, 68, 0, 69, 124, 69, 76, 5, 124, 120, 48, 68, 0, 69, 124, 68, 12, 10, 28, 120, 112,
    68, 0, 20, 48, 120, 124, 108, 69, 76, 67, 0, 84, 0, 67, 96, 69, 120, 70, 12, 69, 120, 67, 96, 68, 0, 69, 124, 71, 76, 66, 12, 86, 0, 69, 124, 68, 12, 10, 28, 120, 112, 70, 0, 69, 124, 70, 108, 66, 12, 70, 0, 69, 124, 98, 0, 68, 7, 68, 6, 0, 7, 3, 70, 0, 68, 3, 70, 6, 68, 3, 12, 0, 4, 7, 3, 70, 1, 12, 3, 7, 4, 0, 68, 7, 28, 0, 1, 7, 6, 4, 68, 0, 68, 7, 68, 6, 4, 7, 3, 1,
    68, 0, 66, 2, 70, 6, 4, 7, 3, 1, 86, 0, 68, 3, 70, 6, 68, 3, 70, 0, 68, 7, 94, 0, 68, 7, 68, 6, 4, 7, 3, 1, 70, 0, 68, 7, 72, 6, 70, 0, 68, 7, 72, 6, 126, 98, 0, 247
]);


/***/ }),

/***/ "./src/lib.js":
/*!********************!*\
  !*** ./src/lib.js ***!
  \********************/
/*! exports provided: loadlib */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadlib", function() { return loadlib; });
function loadlib(cb) {
  let memory = new WebAssembly.Memory({ initial: 2048, maximum: 4096 });
  let heap = new Uint8Array(memory.buffer);
  let imports = { env: { memory: memory } };

  WebAssembly.instantiateStreaming(fetch("./lib.wasm"), imports).then(function(obj) {
    // one would think that a priority for wasm 1.0 would be convenient interop with javascript typed arrays,
    // like why not allow you to just pass in an Uint8Array array as a param and have it "mmap()"
    // the array buffer for the duration of the function call to some high memory address
    // and pass it in as a pointer. But alas no, one is supposed to perform rituals like this
    obj.heap = heap;
    obj.inbuffer = heap.subarray(0,1024);
    obj.outbuffer = heap.subarray(1024,2048);
    obj.fn = obj.instance.exports;
    obj.wrap_array = function(fn, src) {
      obj.inbuffer.set(src)
      let len = fn(obj.outbuffer.byteOffset, obj.outbuffer.byteLength, obj.inbuffer.byteOffset,src.length);
      if (len < 0) {
        throw new Error("failed at call" + fn + ": " + len);
      }
      return new Uint8Array(obj.outbuffer.subarray(0,len));
    }
    cb(obj);
  });
}



/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwcC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRkE7QUFBQTtBQUFpQzs7QUFFakMsV0FBVyxXQUFXO0FBQ3RCO0FBQ0EsV0FBVyxVQUFVO0FBQ3JCO0FBQ0EsV0FBVyxXQUFXO0FBQ3RCO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSx1REFBTztBQUNQO0FBQ0E7QUFDQSxDQUFDOzs7QUFHRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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RUEsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBLG1CQUFtQixnQkFBZ0I7QUFDbkMsa0NBQWtDLGVBQWU7QUFDakQsYUFBYSxpQkFBaUI7QUFDOUIscUJBQXFCLGlCQUFpQjtBQUN0QztBQUNBLDBDQUEwQywrQkFBK0IsRUFBRTtBQUMzRSwrQkFBK0IsOEJBQThCLEVBQUU7QUFDL0Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsMkI7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7OztBQ3haQTtBQUFBO0FBQU87QUFDUCx1Q0FBdUMsK0JBQStCO0FBQ3RFO0FBQ0EsaUJBQWlCLE9BQU8saUJBQWlCOztBQUV6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0giLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9zcmMvYXBwLmpzXCIpO1xuIiwiaW1wb3J0IHtsb2FkbGlifSBmcm9tIFwiLi9saWIuanNcIjtcblxuLyoqIEB0eXBlIHtNSURJQWNjZXNzfSAqL1xubGV0IG1pZGkgPSBudWxsO1xuLyoqIEB0eXBlIHtNSURJSW5wdXR9ICovXG5sZXQgZGVsdWdlSW4gPSBudWxsO1xuLyoqIEB0eXBlIHtNSURJT3V0cHV0fSAqL1xubGV0IGRlbHVnZU91dCA9IG51bGw7XG5sZXQgdGhlSW50ZXJ2YWwgPSBudWxsO1xuXG5sZXQgZGlkX29sZWQgPSBmYWxzZTtcblxubGV0IGxpYiA9IG51bGw7XG5sb2FkbGliKGZ1bmN0aW9uKGwpIHtcbiAgbGliID0gbDtcbiAgd2luZG93LmxpYiA9IGw7XG59KVxuXG5cbmZ1bmN0aW9uICQobmFtZSkge1xuICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobmFtZSlcbn1cblxuZnVuY3Rpb24gc2V0c3RhdHVzKHRleHQpIHtcbiAgJChcIm1pZGlTdGF0dXNcIikuaW5uZXJUZXh0ID0gdGV4dFxufVxuXG5mdW5jdGlvbiBzZXRJbnB1dChpbnB1dCkge1xuICBpZiAoZGVsdWdlSW4gPT0gaW5wdXQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGRlbHVnZUluICE9IG51bGwpIHtcbiAgICBkZWx1Z2VJbi5yZW1vdmVFdmVudExpc3RlbmVyKFwibWlkaW1lc3NhZ2VcIiwgaGFuZGxlRGF0YSk7XG4gIH1cbiAgZGVsdWdlSW4gPSBpbnB1dDtcbiAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwibWlkaW1lc3NhZ2VcIiwgaGFuZGxlRGF0YSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcG9wdWxhdGVEZXZpY2VzKCkge1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG1pZGkuaW5wdXRzKSB7XG4gICAgY29uc3QgcG9ydCA9IGVudHJ5WzFdO1xuICAgIGNvbnN0IG9wdCA9IG5ldyBPcHRpb24ocG9ydC5uYW1lLCBwb3J0LmlkKTtcbiAgICAkKFwiY2hvb3NlSW5cIikuYXBwZW5kQ2hpbGQob3B0KTtcbiAgICBpZiAocG9ydC5uYW1lLmluY2x1ZGVzKFwiRGVsdWdlIE1JREkgM1wiKSkge1xuICAgICAgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgIHNldElucHV0KHBvcnQpO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG1pZGkub3V0cHV0cykge1xuICAgIGNvbnN0IHBvcnQgPSBlbnRyeVsxXTtcbiAgICBjb25zdCBvcHQgPSBuZXcgT3B0aW9uKHBvcnQubmFtZSwgcG9ydC5pZCk7XG4gICAgJChcImNob29zZU91dFwiKS5hcHBlbmRDaGlsZChvcHQpO1xuICAgIGlmIChwb3J0Lm5hbWUuaW5jbHVkZXMoXCJEZWx1Z2UgTUlESSAzXCIpKSB7XG4gICAgICBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgZGVsdWdlT3V0ID0gcG9ydDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gb25DaGFuZ2VJbihldikge1xuICBjb25zdCBpZCA9IGV2LnRhcmdldC52YWx1ZTtcbiAgc2V0SW5wdXQobWlkaS5pbnB1dHMuZ2V0KGlkKSlcbn1cblxuZnVuY3Rpb24gb25DaGFuZ2VPdXQoZXYpIHtcbiAgY29uc3QgaWQgPSBldi50YXJnZXQudmFsdWU7XG4gIGNvbnNvbGUubG9nKFwiY2hvb3NlIHRoZSBpZDpcIiArIGlkKVxuICBkZWx1Z2VPdXQgPSBtaWRpLm91dHB1dHMuZ2V0KGlkKSB8fCBudWxsO1xuICBjb25zb2xlLmxvZyhcImNob29zZSB0aGUgcG9ydDpcIiArIGRlbHVnZU91dClcbn1cblxuZnVuY3Rpb24gb25TdGF0ZUNoYW5nZShldikge1xuICBjb25zdCBwb3J0ID0gZXYucG9ydDtcbiAgY29uc3QgZGVsZXQgPSAocG9ydC5zdGF0ZSA9PSBcImRpc2Nvbm5lY3RlZFwiKTtcbiAgaWYgKHBvcnQudHlwZSA9PSBcImlucHV0XCIpIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBsZXQgY2hpbGRyZW4gPSAkKFwiY2hvb3NlSW5cIikuY2hpbGROb2RlcztcbiAgICBmb3IgKGxldCBpPTA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGNoaWxkcmVuW2ldLnZhbHVlID09IHBvcnQuaWQpIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBpZiAoZGVsZXQpIHtcbiAgICAgICAgICBjaGlsZHJlbltpXS5yZW1vdmUoKTtcbiAgICAgICAgICBpZiAocG9ydCA9PSBkZWx1Z2VJbikge1xuICAgICAgICAgICAgJChcIm5vbmVJbnB1dFwiKS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAvLyBvciBtYXliZSBub3QsIGlmIGlkOiBhcmUgcHJlc2VydmVkIGR1cmluZyBhIGRpc2Nvbm5lY3QvY29ubmVjdCBjeWNsZVxuICAgICAgICAgICAgc2V0SW5wdXQobnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQgJiYgIWRlbGV0KSB7XG4gICAgICBjb25zdCBvcHQgPSBuZXcgT3B0aW9uKHBvcnQubmFtZSwgcG9ydC5pZCk7XG4gICAgICAkKFwiY2hvb3NlSW5cIikuYXBwZW5kQ2hpbGQob3B0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgbGV0IGNoaWxkcmVuID0gJChcImNob29zZU91dFwiKS5jaGlsZE5vZGVzO1xuICAgIGZvciAobGV0IGk9MDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoY2hpbGRyZW5baV0udmFsdWUgPT0gcG9ydC5pZCkge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGlmIChkZWxldCkge1xuICAgICAgICAgIGNoaWxkcmVuW2ldLnJlbW92ZSgpO1xuICAgICAgICAgIGlmIChwb3J0ID09IGRlbHVnZU91dCkge1xuICAgICAgICAgICAgJChcIm5vbmVPdXRwdXRcIikuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gb3IgbWF5YmUgbm90LCBpZiBpZDogYXJlIHByZXNlcnZlZCBkdXJpbmcgYSBkaXNjb25uZWN0L2Nvbm5lY3QgY3ljbGVcbiAgICAgICAgICAgIGRlbHVnZU91dCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQgJiYgIWRlbGV0KSB7XG4gICAgICBjb25zdCBvcHQgPSBuZXcgT3B0aW9uKHBvcnQubmFtZSwgcG9ydC5pZCk7XG4gICAgICAkKFwiY2hvb3NlT3V0XCIpLmFwcGVuZENoaWxkKG9wdCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG9uTUlESVN1Y2Nlc3MobWlkaUFjY2Vzcykge1xuICBzZXRzdGF0dXMoXCJ3ZWJtaWRpIHJlYWR5XCIpO1xuICBtaWRpID0gbWlkaUFjY2VzczsgLy8gc3RvcmUgaW4gdGhlIGdsb2JhbCAoaW4gcmVhbCB1c2FnZSwgd291bGQgcHJvYmFibHkga2VlcCBpbiBhbiBvYmplY3QgaW5zdGFuY2UpXG4gIHBvcHVsYXRlRGV2aWNlcygpXG4gIG1pZGkuYWRkRXZlbnRMaXN0ZW5lcihcInN0YXRlY2hhbmdlXCIsIG9uU3RhdGVDaGFuZ2UpXG59XG5cbmZ1bmN0aW9uIG9uTUlESUZhaWx1cmUobXNnKSB7XG4gIHNldHN0YXR1cyhgRmFpbGVkIHRvIGdldCBNSURJIGFjY2VzcyA6KCAtICR7bXNnfWApO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICBpZiAobmF2aWdhdG9yLnJlcXVlc3RNSURJQWNjZXNzKSB7XG4gICAgbmF2aWdhdG9yLnJlcXVlc3RNSURJQWNjZXNzKHsgc3lzZXg6IHRydWUgfSkudGhlbiggb25NSURJU3VjY2Vzcywgb25NSURJRmFpbHVyZSApO1xuICB9IGVsc2Uge1xuICAgIHNldHN0YXR1cyhcIndlYm1pZGkgdW5hdmFpbCwgY2hlY2sgYnJvd3NlciBwZXJtaXNzaW9uc1wiKTtcbiAgfVxuXG4gICQoXCJwaW5nQnV0dG9uXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBwaW5nVGVzdClcbiAgJChcImdldE9sZWRCdXR0b25cIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdldE9sZWQpXG4gICQoXCJnZXQ3c2VnQnV0dG9uXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnZXQ3c2VnKVxuICAkKFwiZmxpcEJ1dHRvblwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZmxpcHNjcmVlbilcbiAgJChcImdldERlYnVnQnV0dG9uXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnZXREZWJ1ZylcbiAgJChcImludGVydmFsQnV0dG9uXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzZXRSZWZyZXNoKVxuICAkKFwidGVzdERlY29kZUJ1dHRvblwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gZGVjb2RlKHRlc3RkYXRhKSlcbiAgJChcInRlc3Q3c2VnQnV0dG9uXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBkcmF3N1NlZyhbNDcsMyw4LDE5XSwgMykpXG5cbiAgJChcImNob29zZUluXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgb25DaGFuZ2VJbilcbiAgJChcImNob29zZU91dFwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIG9uQ2hhbmdlT3V0KVxuICByZXR1cm47XG59KTtcblxuXG5mdW5jdGlvbiBwaW5nVGVzdCgpIHtcbiAgICBkZWx1Z2VPdXQuc2VuZChbMHhmMCwgMHg3ZCwgMHgwMCwgMHhmN10pO1xufVxuXG5mdW5jdGlvbiBvbGRDb2RlcygpIHtcbiAgIGZvciAoY29uc3QgZW50cnkgb2YgbWlkaS5pbnB1dHMpIHtcbiAgICBjb25zdCBpbnB1dCA9IGVudHJ5WzFdO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYElucHV0IHBvcnQgW3R5cGU6JyR7aW5wdXQudHlwZX0nXWAgK1xuICAgICAgICBgIGlkOicke2lucHV0LmlkfSdgICtcbiAgICAgICAgYCBtYW51ZmFjdHVyZXI6JyR7aW5wdXQubWFudWZhY3R1cmVyfSdgICtcbiAgICAgICAgYCBuYW1lOicke2lucHV0Lm5hbWV9J2AgK1xuICAgICAgICBgIHZlcnNpb246JyR7aW5wdXQudmVyc2lvbn0nYCxcbiAgICApO1xuICB9XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBtaWRpLm91dHB1dHMpIHtcbiAgICBjb25zdCBvdXRwdXQgPSBlbnRyeVsxXTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBPdXRwdXQgcG9ydCBbdHlwZTonJHtvdXRwdXQudHlwZX0nXSBpZDonJHtvdXRwdXQuaWR9JyBtYW51ZmFjdHVyZXI6JyR7b3V0cHV0Lm1hbnVmYWN0dXJlcn0nIG5hbWU6JyR7b3V0cHV0Lm5hbWV9JyB2ZXJzaW9uOicke291dHB1dC52ZXJzaW9ufSdgLFxuICAgICk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0T2xlZCgpIHtcbiAgICBkZWx1Z2VPdXQuc2VuZChbMHhmMCwgMHg3ZCwgMHgwMiwgMHgwMCwgMHgwMSwgMHhmN10pO1xufVxuXG5mdW5jdGlvbiBnZXQ3c2VnKCkge1xuICAgIGRlbHVnZU91dC5zZW5kKFsweGYwLCAweDdkLCAweDAyLCAweDAxLCAweDAwLCAweGY3XSk7XG59XG5cbmZ1bmN0aW9uIGdldERpc3BsYXkoZm9yY2UpIHtcbiAgICBkZWx1Z2VPdXQuc2VuZChbMHhmMCwgMHg3ZCwgMHgwMiwgMHgwMCwgZm9yY2UgPyAweDAzIDogMHgwMiwgMHhmN10pO1xufVxuXG5mdW5jdGlvbiBnZXREZWJ1ZygpIHtcbiAgICBkZWx1Z2VPdXQuc2VuZChbMHhmMCwgMHg3ZCwgMHgwMywgMHgwMCwgMHgwMSwgMHhmN10pO1xufVxuXG5mdW5jdGlvbiBmbGlwc2NyZWVuKCkge1xuICAgIGRlbHVnZU91dC5zZW5kKFsweGYwLCAweDdkLCAweDAyLCAweDAwLCAweDA0LCAweGY3XSk7XG59XG5cbmZ1bmN0aW9uIHNldFJlZnJlc2goKSB7XG4gIGlmICh0aGVJbnRlcnZhbCAhPSBudWxsKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGVJbnRlcnZhbClcbiAgICB0aGVJbnRlcnZhbCA9IG51bGw7XG4gIH1cblxuICB0aGVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkgeyBnZXREaXNwbGF5KGZhbHNlKTsgfSwgMTAwMCk7XG4gIGdldERpc3BsYXkodHJ1ZSk7XG59XG5cbmxldCBsYXN0bXNnXG5cbi8qKiBAcGFyYW0ge01JRElNZXNzYWdlRXZlbnR9IG1zZyAqL1xuZnVuY3Rpb24gaGFuZGxlRGF0YShtc2cpIHtcbiAgbGFzdG1zZyA9IG1zZ1xuICAvLyBjb25zb2xlLmxvZyhtc2cuZGF0YSk7XG4gIGlmIChtc2cuZGF0YS5sZW5ndGggPiA4KSB7XG4gICAgJChcImRhdGFMb2dcIikuaW5uZXJUZXh0ID0gXCJzaXplOiBcIiArIG1zZy5kYXRhLmxlbmd0aFxuICB9XG4gIGRlY29kZShtc2cuZGF0YSlcbn1cblxuLyoqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YSAqL1xuZnVuY3Rpb24gZGVjb2RlKGRhdGEpIHtcbiAgaWYgKGRhdGEubGVuZ3RoIDwgMyB8fCBkYXRhWzBdICE9IDB4ZjAgfHwgZGF0YVsxXSAhPSAweDdkKSB7XG4gICAgY29uc29sZS5sb2coXCJmb3JlaWduIHN5c2V4P1wiKVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChkYXRhLmxlbmd0aCA+PSA1ICYmIGRhdGFbMl0gPT0gMHgwMiAmJiBkYXRhWzNdID09IDB4NDApIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcImZvdW5kIE9MRUQhXCIpXG5cbiAgICBpZiAoZGF0YVs0XSA9PSAxKSB7XG4gICAgICBkcmF3T2xlZChkYXRhKVxuICAgIH0gZWxzZSBpZiAoZGF0YVs0XSA9PSAyKSB7XG4gICAgICBkcmF3T2xlZERlbHRhKGRhdGEpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRE8gTk9UIERPIFRIQVRcIilcbiAgICB9XG5cbiAgfSBlbHNlIGlmIChkYXRhLmxlbmd0aCA+PSA1ICYmIGRhdGFbMl0gPT0gMHgwMiAmJiBkYXRhWzNdID09IDB4NDEpIHtcbiAgICBjb25zb2xlLmxvZyhcImZvdW5kIDdzZWchXCIpXG5cbiAgICBpZiAoZGF0YVs0XSAhPSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkRPIE5PVCBETyBUSEFUXCIpXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZHJhdzdTZWcoZGF0YS5zdWJhcnJheSg3LDExKSwgZGF0YVs2XSlcbiAgfSBlbHNlIGlmIChkYXRhLmxlbmd0aCA+PSA1ICYmIGRhdGFbMl0gPT0gMHgwMyAmJiBkYXRhWzNdID09IDB4NDApIHtcbiAgICBjb25zb2xlLmxvZyhcImZvdW5kIGRlYnVnIVwiKVxuICAgIC8vIGRhdGFbNF06IHVudXNlZCBjYXRlZ29yeVxuXG4gICAgbGV0IG1zZ2J1ZiA9IGRhdGEuc3ViYXJyYXkoNSwgZGF0YS5sZW5ndGgtMSk7XG4gICAgbGV0IG1lc3NhZ2UgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUobXNnYnVmKVxuICAgIGxldCBjaHVua3MgPSBtZXNzYWdlLnNwbGl0KCdcXG4nKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAkKCdkZWJ1Z091dHB1dCcpLmluc2VydEFkamFjZW50VGV4dCgnYmVmb3JlZW5kJywgY2h1bmtzW2ldKVxuICAgICAgaWYgKGkgPCBjaHVua3MubGVuZ3RoLTEpIHtcbiAgICAgICAgJCgnZGVidWdPdXRwdXQnKS5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2JlZm9yZWVuZCcsIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiclwiKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmxldCBvbGVkRGF0YSA9IG5ldyBVaW50OEFycmF5KDYqMTI4KTtcblxuZnVuY3Rpb24gZHJhd09sZWQoZGF0YSkge1xuICBsZXQgcGFja2VkID0gZGF0YS5zdWJhcnJheSg2LGRhdGEubGVuZ3RoLTEpXG5cbiAgbGV0IHVucGFja2VkID0gbGliLndyYXBfYXJyYXkobGliLmZuLnVucGFja183dG84X3JsZSwgcGFja2VkKVxuICBjb25zb2xlLmxvZyhgcmVzZXQgJHt1bnBhY2tlZC5sZW5ndGh9IGFzICR7cGFja2VkLmxlbmd0aH1gKTtcblxuICBpZiAodW5wYWNrZWQubGVuZ3RoID09IG9sZWREYXRhLmxlbmd0aCkge1xuICAgIG9sZWREYXRhID0gdW5wYWNrZWQ7XG4gIH1cbiAgZHJhd09sZWRkYXRhKHVucGFja2VkKTtcbn1cblxuZnVuY3Rpb24gZHJhd09sZWREZWx0YShkYXRhKSB7XG5cbiAgbGV0IGZpcnN0ID0gZGF0YVs1XTtcbiAgbGV0IGxlbiA9IGRhdGFbNl07XG4gIGxldCBwYWNrZWQgPSBkYXRhLnN1YmFycmF5KDcsZGF0YS5sZW5ndGgtMSlcbiAgLy9jb25zb2xlLmxvZyhcInBhY2tlZCBzaXplIFwiKyBwYWNrZWQubGVuZ3RoKTtcblxuICBsZXQgdW5wYWNrZWQgPSBsaWIud3JhcF9hcnJheShsaWIuZm4udW5wYWNrXzd0bzhfcmxlLCBwYWNrZWQpXG4gIGNvbnNvbGUubG9nKGBmaXJzdCAke2ZpcnN0fSwgbGVuICR7bGVufSwgZGVsdGEgc2l6ZSAke3VucGFja2VkLmxlbmd0aH0gYXMgJHtwYWNrZWQubGVuZ3RofWApO1xuXG4gIG9sZWREYXRhLnN1YmFycmF5KDgqZmlyc3QsOCooZmlyc3QrbGVuKSkuc2V0KHVucGFja2VkKVxuICBkcmF3T2xlZGRhdGEob2xlZERhdGEpO1xufVxuXG5sZXQgb2ZmeCA9IDEwO1xubGV0IG9mZnkgPSA1O1xuXG5mdW5jdGlvbiBkcmF3T2xlZGRhdGEoZGF0YSkge1xuICAvKiogQHR5cGUge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gKi9cbiAgbGV0IGN0eCA9ICQoXCJzY3JlZW5DYW52YXNcIikuZ2V0Q29udGV4dChcIjJkXCIpXG5cbiAgbGV0IHB4X2hlaWdodCA9IDU7XG4gIGxldCBweF93aWR0aCA9IDU7XG4gIGxldCBpbmRpc3QgPSAwLjU7XG5cbiAgbGV0IGJsa193aWR0aCA9IDEyODtcbiAgY3R4LmZpbGxTdHlsZSA9IFwiIzExMTExMVwiO1xuICBjdHguZmlsbFJlY3Qob2ZmeCxvZmZ5LHB4X3dpZHRoKjEyOCxweF9oZWlnaHQqNDgpXG4gIGRpZF9vbGVkID0gdHJ1ZTtcblxuICBjdHguZmlsbFN0eWxlID0gXCIjZWVlZWVlXCI7XG4gIGZvciAobGV0IGJsayA9IDA7IGJsayA8IDY7IGJsaysrKSB7XG4gICAgZm9yIChsZXQgcnN0cmlkZSA9IDA7IHJzdHJpZGUgPCA4OyByc3RyaWRlKyspIHtcbiAgICAgIGxldCBtYXNrID0gMSA8PCAocnN0cmlkZSk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJsa193aWR0aDsgaisrKSB7XG4gICAgICAgIGlmICgoYmxrKmJsa193aWR0aCtqKSA+IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlkYXRhID0gKGRhdGFbYmxrKmJsa193aWR0aCtqXSAmIG1hc2spO1xuXG4gICAgICAgIGxldCB5ID0gYmxrKjggKyByc3RyaWRlO1xuXG4gICAgICAgIGlmIChpZGF0YSA+IDApIHtcbiAgICAgICAgICBjdHguZmlsbFJlY3Qob2ZmeCtqKnB4X3dpZHRoK2luZGlzdCxvZmZ5K3kqcHhfaGVpZ2h0K2luZGlzdCwgcHhfd2lkdGgtMippbmRpc3QsIHB4X2hlaWdodC0yKmluZGlzdCk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3N1NlZyhkaWdpdHMsIGRvdHMpIHtcbiAgLyoqIEB0eXBlIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9ICovXG4gIGxldCBjdHggPSAkKFwic2NyZWVuQ2FudmFzXCIpLmdldENvbnRleHQoXCIyZFwiKVxuXG4gIGN0eC5maWxsU3R5bGUgPSBcIiMxMTExMTFcIjtcbiAgaWYgKGRpZF9vbGVkKSB7XG4gICAgY3R4LmZpbGxSZWN0KG9mZngsb2ZmeSw1KjEyOCw1KjQ4KVxuICAgIGRpZF9vbGVkID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgY3R4LmZpbGxSZWN0KG9mZngsb2ZmeSwzMTAsMTQwKVxuICB9XG5cbiAgbGV0IGRpZ2l0X2hlaWdodCA9IDEyMDtcbiAgbGV0IGRpZ2l0X3dpZHRoID0gNjA7XG4gIGxldCBzdHJva2VfdGhpY2sgPSA5O1xuICBsZXQgaGFsZl9oZWlnaHQgPSBkaWdpdF9oZWlnaHQvMjtcbiAgbGV0IG91dF9hZGogPSAwLjU7XG4gIGxldCBpbl9hZGogPSAxLjU7XG5cbiAgbGV0IG9mZl95ID0gb2ZmeSArIDY7XG5cbiAgbGV0IHRvcGJvdCA9IFtbb3V0X2FkaiwwXSxbc3Ryb2tlX3RoaWNrK2luX2Fkaiwgc3Ryb2tlX3RoaWNrXSxbZGlnaXRfd2lkdGgtKHN0cm9rZV90aGljaytpbl9hZGopLCBzdHJva2VfdGhpY2tdLCBbZGlnaXRfd2lkdGgtb3V0X2FkaiwgMF1dO1xuICBsZXQgaGFsZnNpZGUgPSBbWzAsb3V0X2Fkal0sW3N0cm9rZV90aGljaywgc3Ryb2tlX3RoaWNrK2luX2Fkal0sW3N0cm9rZV90aGljaywgaGFsZl9oZWlnaHQtc3Ryb2tlX3RoaWNrKjAuNS1pbl9hZGpdLCBbMCwgaGFsZl9oZWlnaHQtb3V0X2Fkal1dO1xuICBsZXQgaCA9IGhhbGZfaGVpZ2h0O1xuICBsZXQgaHQgPSBzdHJva2VfdGhpY2s7XG4gIGxldCBodGEgPSBzdHJva2VfdGhpY2svMi8vLWluX2Fkai8yO1xuICBsZXQgbWlkbGluZSA9IFtcbiAgICBbb3V0X2FkaixoXSxbaHQsaC1odGFdLCBbZGlnaXRfd2lkdGgtaHQsaC1odGFdLFxuICAgIFtkaWdpdF93aWR0aC1vdXRfYWRqLCBoXSwgW2RpZ2l0X3dpZHRoLWh0LGgraHRhXSwgW2h0LGgraHRhXVxuICBdO1xuXG4gIGZvciAobGV0IGQgPSAwOyBkIDwgNDsgZCsrKSB7XG4gICAgbGV0IGRpZ2l0ID0gZGlnaXRzW2RdO1xuICAgIGxldCBkb3QgPSAoZG90cyAmICgxIDw8IGQpKSAhPSAwO1xuXG4gICAgbGV0IG9mZl94ID0gb2ZmeCArIDggKyAoMTMrZGlnaXRfd2lkdGgpKmQ7XG5cbiAgICBmb3IgKGxldCBzID0gMDsgcyA8IDc7IHMrKykge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgICBsZXQgcGF0aDtcbiAgICAgIGlmIChzID09IDApIHsgcGF0aCA9IG1pZGxpbmU7IH1cbiAgICAgIGVsc2UgaWYgKHMgPT0gMyB8fCBzID09IDYpIHsgcGF0aCA9IHRvcGJvdDsgfVxuICAgICAgZWxzZSAgeyBwYXRoID0gaGFsZnNpZGU7IH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgYyA9IHBhdGhbaV07XG4gICAgICAgIGlmIChzID09IDIgfHwgcyA9PSAzIHx8IHMgPT0gNCApIHsgYyA9IFtjWzBdLCBkaWdpdF9oZWlnaHQtY1sxXV07IH0gLy8gZmxpcCBob3JpelxuICAgICAgICBpZiAocyA9PSA0IHx8IHMgPT0gNSkgeyBjID0gW2RpZ2l0X3dpZHRoLWNbMF0sIGNbMV1dOyB9IC8vIGZsaXAgdmVydFxuICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgY3R4Lm1vdmVUbyhvZmZfeCtjWzBdLCBvZmZfeStjWzFdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdHgubGluZVRvKG9mZl94K2NbMF0sIG9mZl95K2NbMV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGN0eC5jbG9zZVBhdGgoKVxuXG4gICAgICBpZiAoZGlnaXQgJiAoMTw8cykpIHsgXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiNDQzMzMzNcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiMzMzExMTFcIjtcbiAgICAgIH1cbiAgICAgIGN0eC5maWxsKClcbiAgICB9XG5cbiAgICAvLyB0aGUgZG90XG4gICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgY3R4LnJlY3Qob2ZmX3grZGlnaXRfd2lkdGgrMywgb2ZmX3krZGlnaXRfaGVpZ2h0KzMsIDYuNSwgNi41KTtcbiAgICBpZiAoZG90KSB7XG4gICAgICBjdHguZmlsbFN0eWxlID0gXCIjQ0MzMzMzXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiMzMzExMTFcIjtcbiAgICB9XG4gICAgY3R4LmZpbGwoKVxuICB9XG59XG5cbmxldCB0ZXN0ZGF0YSA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAyNDAsIDEyNSwgMiwgNjQsIDEsIDAsIDEyNiwgMTI3LCAwLCAxMDIsIDAsIDY2LCA3NiwgNzEsIDE4LCA0NCwgMTAwLCAwLCA2LCA4LCAxMTIsIDM2LCA4LCA2LCAwLCAxMjYsIDgsIDE2LCAxNiwgMzIsIDEyNiwgMCwgNjgsIDIsIDY3LCAxMjYsIDY4LCAyLCAyLCAwLCAxMjYsIDcwLCAxNiwgNjcsIDEyNiwgMTI2LCAxMjcsIDAsIDExNCwgMCwgNzEsIDY0LCA3MiwgMCwgNjksIDEyNCwgNjgsIDEwOCwgMywgMTI0LCAxMjAsIDY4LCAwLCA2NywgOTYsIDY5LCAxMjAsIDcwLCAxMiwgNjksIDEyMCwgNTcsIDk2LCAwLCAwLCAxMTIsIDEyNCwgMjcsIDI4LCAxMjQsIDExMiwgMCwgNjgsIDAsIDY5LCAxMjQsIDY5LCA3NiwgNSwgMTI0LCAxMjAsIDQ4LCA2OCwgMCwgNjksIDEyNCwgNjgsIDEyLCAxMCwgMjgsIDEyMCwgMTEyLFxuICAgIDY4LCAwLCAyMCwgNDgsIDEyMCwgMTI0LCAxMDgsIDY5LCA3NiwgNjcsIDAsIDg0LCAwLCA2NywgOTYsIDY5LCAxMjAsIDcwLCAxMiwgNjksIDEyMCwgNjcsIDk2LCA2OCwgMCwgNjksIDEyNCwgNzEsIDc2LCA2NiwgMTIsIDg2LCAwLCA2OSwgMTI0LCA2OCwgMTIsIDEwLCAyOCwgMTIwLCAxMTIsIDcwLCAwLCA2OSwgMTI0LCA3MCwgMTA4LCA2NiwgMTIsIDcwLCAwLCA2OSwgMTI0LCA5OCwgMCwgNjgsIDcsIDY4LCA2LCAwLCA3LCAzLCA3MCwgMCwgNjgsIDMsIDcwLCA2LCA2OCwgMywgMTIsIDAsIDQsIDcsIDMsIDcwLCAxLCAxMiwgMywgNywgNCwgMCwgNjgsIDcsIDI4LCAwLCAxLCA3LCA2LCA0LCA2OCwgMCwgNjgsIDcsIDY4LCA2LCA0LCA3LCAzLCAxLFxuICAgIDY4LCAwLCA2NiwgMiwgNzAsIDYsIDQsIDcsIDMsIDEsIDg2LCAwLCA2OCwgMywgNzAsIDYsIDY4LCAzLCA3MCwgMCwgNjgsIDcsIDk0LCAwLCA2OCwgNywgNjgsIDYsIDQsIDcsIDMsIDEsIDcwLCAwLCA2OCwgNywgNzIsIDYsIDcwLCAwLCA2OCwgNywgNzIsIDYsIDEyNiwgOTgsIDAsIDI0N1xuXSk7XG4iLCJleHBvcnQgZnVuY3Rpb24gbG9hZGxpYihjYikge1xuICBsZXQgbWVtb3J5ID0gbmV3IFdlYkFzc2VtYmx5Lk1lbW9yeSh7IGluaXRpYWw6IDIwNDgsIG1heGltdW06IDQwOTYgfSk7XG4gIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkobWVtb3J5LmJ1ZmZlcik7XG4gIGxldCBpbXBvcnRzID0geyBlbnY6IHsgbWVtb3J5OiBtZW1vcnkgfSB9O1xuXG4gIFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlU3RyZWFtaW5nKGZldGNoKFwiLi9saWIud2FzbVwiKSwgaW1wb3J0cykudGhlbihmdW5jdGlvbihvYmopIHtcbiAgICAvLyBvbmUgd291bGQgdGhpbmsgdGhhdCBhIHByaW9yaXR5IGZvciB3YXNtIDEuMCB3b3VsZCBiZSBjb252ZW5pZW50IGludGVyb3Agd2l0aCBqYXZhc2NyaXB0IHR5cGVkIGFycmF5cyxcbiAgICAvLyBsaWtlIHdoeSBub3QgYWxsb3cgeW91IHRvIGp1c3QgcGFzcyBpbiBhbiBVaW50OEFycmF5IGFycmF5IGFzIGEgcGFyYW0gYW5kIGhhdmUgaXQgXCJtbWFwKClcIlxuICAgIC8vIHRoZSBhcnJheSBidWZmZXIgZm9yIHRoZSBkdXJhdGlvbiBvZiB0aGUgZnVuY3Rpb24gY2FsbCB0byBzb21lIGhpZ2ggbWVtb3J5IGFkZHJlc3NcbiAgICAvLyBhbmQgcGFzcyBpdCBpbiBhcyBhIHBvaW50ZXIuIEJ1dCBhbGFzIG5vLCBvbmUgaXMgc3VwcG9zZWQgdG8gcGVyZm9ybSByaXR1YWxzIGxpa2UgdGhpc1xuICAgIG9iai5oZWFwID0gaGVhcDtcbiAgICBvYmouaW5idWZmZXIgPSBoZWFwLnN1YmFycmF5KDAsMTAyNCk7XG4gICAgb2JqLm91dGJ1ZmZlciA9IGhlYXAuc3ViYXJyYXkoMTAyNCwyMDQ4KTtcbiAgICBvYmouZm4gPSBvYmouaW5zdGFuY2UuZXhwb3J0cztcbiAgICBvYmoud3JhcF9hcnJheSA9IGZ1bmN0aW9uKGZuLCBzcmMpIHtcbiAgICAgIG9iai5pbmJ1ZmZlci5zZXQoc3JjKVxuICAgICAgbGV0IGxlbiA9IGZuKG9iai5vdXRidWZmZXIuYnl0ZU9mZnNldCwgb2JqLm91dGJ1ZmZlci5ieXRlTGVuZ3RoLCBvYmouaW5idWZmZXIuYnl0ZU9mZnNldCxzcmMubGVuZ3RoKTtcbiAgICAgIGlmIChsZW4gPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImZhaWxlZCBhdCBjYWxsXCIgKyBmbiArIFwiOiBcIiArIGxlbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkob2JqLm91dGJ1ZmZlci5zdWJhcnJheSgwLGxlbikpO1xuICAgIH1cbiAgICBjYihvYmopO1xuICB9KTtcbn1cblxuIl0sInNvdXJjZVJvb3QiOiIifQ==