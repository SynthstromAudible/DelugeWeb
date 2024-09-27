// Wave was an attempt at using Peak.js for audio.
// I was not able to get it to work with AudioBuffers
<script setup>
import {ref, reactive} from 'vue';

import {editBlob, setWave} from './common.js';

import { AudioPeaks } from 'vue-peaks'


// default styles for the AudioPeaks component
import 'vue-peaks/dist/style.css';

let peakURL = ref("https://localhost:8000/meow.wav");

let peako = ref({});
let keyctr = ref(0);

peako.webAudio = {};

/** reactive properties */
const state = reactive({
  isRendered: false,
  mediaSource: peakURL.value,
  peaksWidth: 80
})


function changeWav(newWave) {
	console.log(newWave);
	peako.webAudio = {audioBuffer: newWave};
	state.isRendered = true;
	keyctr.value++;
}

// setWave(changeWav);

let ctr = 0;
function changit() {
	if ((ctr & 1) == 0) {
	state.mediaSource = "https://localhost:8000/purr.wav";
	} else {
	state.mediaSource = "https://localhost:8000/meow.wav";
	}
	state.isRendered = true;
	ctr++;
}
</script>

<template>
<p/>
<hr/>
        <AudioPeaks v-if='state.isRendered' :key='keyctr' :style="{ width: state.peaksWidth + '%' }"
        :options='peako'/>
<p/>
    <button @click="changit()">
      Change URL
    </button>

</template>
