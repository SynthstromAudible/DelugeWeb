   <template>
  <p/><button type="button" id="OLED" @click="doOLED">OLED</button><p/>
  <br/>
     <canvas ref="canvasElement" width="700" height="260"></canvas>
     <p/>
  </template>
 
<script setup lang="ts">
  import {onMounted, Ref, ref} from "vue";
  import {sendJsonRequest, GetAttachedUint8Array} from "../midilib/main.js";

  function handler(verb, object, data,payoff,zeroX) {
      let attached = GetAttachedUint8Array(data, zeroX);
			//console.log(attached);
			// Do more with data...
			drawOleddata(attached);
  }

  function doOLED() {
  	let req = {"source": "oled"};
  	sendJsonRequest("ui", req, handler);
  }

let offx = 10;
let offy = 5;

function drawOleddata(data) {
  /** @type {CanvasRenderingContext2D} */
  let ctx = context.value;

  let px_height = 5;
  let px_width = 5;
  let indist = 0.5;

  let blk_width = 128;
  ctx.fillStyle = "#111111";
  ctx.fillRect(offx,offy,px_width*128,px_height*48);

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
const gotOled = ref(false);
//const oleddata = Ref<UInt8Array> | undefined> = ref();
const canvasElement: Ref<HTMLCanvasElement | undefined> = ref();
const context: Ref<CanvasRenderingContext2D | undefined> = ref();


onMounted(() => {
    // Get canvas context. If 'getContext' returns 'null', set to 'undefined', so that it conforms to the Ref typing
    context.value = canvasElement.value?.getContext('2d') || undefined;
    render();
});

function render() {
    if (!context.value) {
        return;
    }

    context.value.fillText('Push Test Button', 50, 50);
}
  
  </script>
