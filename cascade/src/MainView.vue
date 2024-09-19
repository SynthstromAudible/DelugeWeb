 <script setup>

  import {onMounted, ref} from 'vue';
	import DirView from "./DirView.vue";
	import MemDump from "./MemDump.vue";
	import { useRoute, useRouter } from 'vue-router'
	
  const router = useRouter();
	const route = useRoute();


 function gotoEditor() {
 	router.replace('/editor');
 }
 
</script>
 
<template>
<br/>
<button type="button" id="editor" @click="gotoEditor">Open Editor</button>
<p/>

<MemDump/>
<DirView/>

</template>

<style>


canvas {
  border:1px solid #000000;
}


</style>