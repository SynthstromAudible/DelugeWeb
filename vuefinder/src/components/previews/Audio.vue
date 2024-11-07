<template>
  <div class="vuefinder__audio-preview">
    <h3 class="vuefinder__audio-preview__title" id="modal-title" :title="app.modal.data.item.path">
      {{ app.modal.data.item.basename }}
    </h3>
    <div v-if='dataRead'>
      <AudioPeaks
        :src="getAudioUrl()" />

    </div>
  </div>
</template>

<script setup>

import {ref, inject, onMounted, onUnmounted} from 'vue';
import { AudioPeaks } from 'vue-peaks';
// default styles for the AudioPeaks component
import 'vue-peaks/dist/style.css';
import {readFile, getRidOfDoubleLeadingSlashes} from "midilib";
const emit = defineEmits(['success']);

const app = inject('ServiceContainer');
const dataRead = ref(false);
let earl;

const getAudioUrl = () => {
  return earl;
}

onMounted(() => {
  let dataVal = app.modal.data;
  let rawPath = dataVal.item.path;
  let readPath = getRidOfDoubleLeadingSlashes(rawPath);
  readFile(readPath, (readPath, err, data)=>{
  	let blob = new Blob([data], { type: "audio/wav" });
  	earl = URL.createObjectURL(blob);
  	dataRead.value = true;
  	emit('success');
  });

});

onUnmounted(() => {
 	if (earl !== undefined) {
 	 URL.revokeObjectURL(earl);
 	 earl = undefined;
 	}
});

</script>
