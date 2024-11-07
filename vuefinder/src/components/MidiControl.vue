<script setup>
	   import {onMounted, ref} from 'vue';
	   import {getDebug, stopDebug, onChangeIn, onChangeOut, informRef} from "../../../midilib/dist/MidiLib.es.js";
	
	function turnOnDebug() {
  showLogWindow.value = true;
 	getDebug();
 }

 function turnOffDebug() {
  stopDebug();
  showLogWindow.value = false;
 }
 
 	let showLogWindow = ref(false);
  let midiLog = ref("");
  informRef(midiLog);
 
</script>

<template>

<div class='ingroup' id='ingroup' width='512px'>
Midi:
     in: <select id="chooseIn"  @change="onChangeIn"><option label="(none)" value="" id="noneInput"/></select>
     out: <select id="chooseOut" @change="onChangeOut"><option label="(none)" value="" id="noneOutput"/></select>
     &nbsp;
		 <template v-if="showLogWindow">
          <button type="button" id="stopDebugButton" @click="turnOffDebug">Stop Debug</button>
     </template>
     <template v-if="!showLogWindow">
          <button type="button" id="getDebugButton" @click="turnOnDebug">Debug</button>
     </template>
</div>
<template v-if="showLogWindow">
<div class='status' id="midiStatus">inactive</div>
<p/>
<div id="debugOutput" class="outbox"  v-html="midiLog">
 </div>
</template>
</template>

<style>

.outbox {
  border:1px solid #000000;
  overflow-y: scroll;

  display: flex;
  flex-direction: column-reverse;

  height: 160px;
  margin-bottom: 10px;
  margin-right: 30px;
}
</style>