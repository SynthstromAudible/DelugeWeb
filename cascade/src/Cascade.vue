 <script setup>
  import {getDebug, stopDebug, onChangeIn, onChangeOut, informRef} from "./mididriver.js";
  import {onMounted, ref} from 'vue';
	import DirView from "./DirView.vue";
	import MemDump from "./MemDump.vue";
  let midiLog = ref("");
  
   onMounted(() => {
			// startup();
			informRef(midiLog);
	});


 </script>
 
<template>
<div class='ingroup' id='ingroup' width='512px'>

&nbsp;

<br/>Midi:
     in: <select id="chooseIn"  @change="onChangeIn"><option label="(none)" value="" id="noneInput"/></select>
     out: <select id="chooseOut" @change="onChangeOut"><option label="(none)" value="" id="noneOutput"/></select>
     &nbsp;
     <button type="button" id="getDebugButton" @click="getDebug">Start SysEx</button>
     &nbsp;
     <button type="button" id="stopDebugButton" @click="stopDebug">Stop SysEx</button>

<p/>
</div>

<p/>

<MemDump/>


<hr/>
<p/>
<div class='status' id="midiStatus">inactive</div>
<p/>
<div id="debugOutput" class="outbox"  v-html="midiLog">
 </div>
 
</template>

<style>


canvas {
  border:1px solid #000000;
}

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