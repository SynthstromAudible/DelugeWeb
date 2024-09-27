<script setup>
import { onMounted, ref } from 'vue';
import { setWave} from './common.js';

const audioContext = ref(null);
const audioBuffer = ref(null);
const soundloaded = ref(false);

function changeWav(newWave) {
	console.log(newWave);
  audioBuffer.value = newWave;
  if (!soundloaded.value) audioContext.value = new AudioContext();
  soundloaded.value = true;
}

setWave(changeWav);

const playAudio = async () => {
      if (audioBuffer.value) {
        const source = audioContext.value.createBufferSource();
        source.buffer = audioBuffer.value;
        source.connect(audioContext.value.destination);
        source.start(0);
      }
 };
</script>

<template>
<button @click="playAudio":disabled='!soundloaded'>Play</button>
</template>

