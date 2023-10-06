 <script setup>
  import {startup, openLocal, clearActiveScanner, changeScale, changePlotHeight} from "./viewEvents.js";
  import {getDebug, stopDebug, onChangeIn, onChangeOut, informRef} from "./mididriver.js";
  import PlotComponent from "./PlotComponent.vue";
  import {onMounted, ref} from 'vue';

  let midiLog = ref("");
  
   onMounted(() => {
			startup();
			informRef(midiLog);
	});

 </script>
 
<template>
<div class='ingroup' id='ingroup' width='512px'>
<input id='opener' name="file" type="file" accept=".txt,.log" @change="openLocal" />
Scale:
<select id = "scale" @change='changeScale'>
<option selected='true'>seconds</option>  
<option>milliseconds</option>  
<option>microseconds</option>
</select>&nbsp;
&nbsp;
Graph&nbsp;Height:
<select id = "plotH" @change='changePlotHeight' >  
<option>50</option>
<option>80</option>
<option selected='true'>100</option>
<option>150</option>
<option>200</option>
<option>250</option>
<option>300</option>
<option>400</option>
<option>500</option>
</select>&nbsp;pixels.

<br/>Midi:
     in: <select id="chooseIn"><option label="(none)" value="" id="noneInput" @change="onChangeIn"/></select>
     out: <select id="chooseOut"><option label="(none)" value="" id="noneOutput" @change="onChangeOut"/></select>
     &nbsp;
     <button type="button" id="getDebugButton" @click="getDebug">Start SysEx</button>
     &nbsp;
     <button type="button" id="stopDebugButton" @click="stopDebug">Stop SysEx</button>
     &nbsp;
		 <button type="button" id="clearbut" @click="clearActiveScanner">Clear</button>
<p/>
</div>
<p/>
<div id='graphs' class='graphs'>
<div id='valuecomps'>
<PlotComponent useId='valuePlots' />
</div>

<div id='timelinecomp'>
<PlotComponent useId='timelinePlot'/>
</div>
</div>
<hr/>
<p/>
<div class='status' id="midiStatus">inactive</div>
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