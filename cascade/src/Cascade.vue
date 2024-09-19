<script setup>
	 import { useRoute, useRouter } from 'vue-router';
	   import {onMounted, ref} from 'vue';
	   import {getDebug, stopDebug, onChangeIn, onChangeOut, informRef} from "./mididriver.js";
	const router = useRouter();
	const route = useRoute();
	
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
  <p>
<strong>Current route path:</strong> {{ route.fullPath }}
  </p>

<br/>
  <nav>
    <RouterLink to="/">Go to Home</RouterLink><p/>
    <RouterLink to="/editor">Go to Editor</RouterLink>
  </nav>
<br/>
<div class='ingroup' id='ingroup' width='512px'>
<br/>Midi:
     in: <select id="chooseIn"  @change="onChangeIn"><option label="(none)" value="" id="noneInput"/></select>
     out: <select id="chooseOut" @change="onChangeOut"><option label="(none)" value="" id="noneOutput"/></select>
     &nbsp;
		 <template v-if="showLogWindow">
          <button type="button" id="stopDebugButton" @click="turnOffDebug">Stop Debug</button>
     </template>
     <template v-if="!showLogWindow">
          <button type="button" id="getDebugButton" @click="turnOnDebug">Debug</button>
     </template>

<p/>
</div>
<p/>
<main>
<RouterView />
</main>
<template v-if="showLogWindow">
<hr/>
<p/>
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