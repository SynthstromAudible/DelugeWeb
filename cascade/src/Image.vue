   <template>
  <p/><button type="button" id="Image" @click="doImage">Image</button><p/>
  <br/>
     <canvas ref="canvasElement" width="608" height="256"></canvas>
     <p/>
  </template>
 
<script setup lang="ts">
  import {onMounted, Ref, ref} from "vue";
  import {sendJsonRequest, GetAttachedUint8Array} from "../midilib/main.js";

  function handler(verb, object, data,payoff,zeroX) {
      let attached = GetAttachedUint8Array(data, zeroX);
			drawImageData(attached);
  }

  function doImage() {
  	let req = {"source": "image"};
  	sendJsonRequest("ui", req, handler);
  }

// Gamma correction was one of the earliest features in Downrush. It was created experimentally.
// Someday we should do proper colorimetry, and perhaps define a separate table for each color component.
let gamma = 1.0 / 5.0;
let gammaTab = [];
for(var i = 0; i < 256; ++i) {
			// gammaTab[i] = 255.0 * ((i / 255.0) ** (1. gamma));
		gammaTab[i] = Math.round( ((i / 255.0) ** gamma * 255.0 ) );
}


let xpw = 32; // x pixel width
let ypw = 32;


function drawImageData(data) {

  let ctx = context.value;

  for(let y = 0; y < 8; ++y) {
		for(let x = 0; x <18; ++x) {
			let yo = (7 - y) * 18 * 3;
			let off = yo + (x * 3);
			
			let r = data[off];
			let g = data[off + 1];
			let b = data[off + 2];
			let rg = gammaTab[r]; // r gamma corrected
			let gg = gammaTab[g];
			let bg = gammaTab[b];
			let fillS = "rgb(" + rg + "," + gg + "," + bg + ")";
			ctx.fillStyle = fillS;

			let xp = x * xpw; // x in pixels.
			let yp = y * ypw;
			
			if (x >= 16) xp+= xpw; // make a gap.

			ctx.fillRect(xp, yp, xpw, ypw);

			ctx.strokeStyle = "black";
			ctx.beginPath();
			ctx.moveTo(xp, yp);
			ctx.lineTo(xp + xpw, yp);
			ctx.lineTo(xp + xpw, yp + ypw);
			ctx.lineTo(xp, yp + ypw);
			ctx.lineTo(xp, yp);
			ctx.stroke();

		}
	}
}


const canvasElement: Ref<HTMLCanvasElement | undefined> = ref();
const context: Ref<CanvasRenderingContext2D | undefined> = ref();


onMounted(() => {
    context.value = canvasElement.value?.getContext('2d') || undefined;
    render();
});

function render() {
    if (!context.value) {
        return;
    }

   // context.value.fillText('Push Image Button', 50, 50);
}
  
  </script>
