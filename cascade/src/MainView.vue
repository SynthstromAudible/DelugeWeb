<script setup lang="ts">

  import {onMounted, ref} from 'vue';
	import DirView from "./DirView.vue";
	import FileTransfer from "./FileTransfer.vue";

	import PlayAudio from "./PlayAudio.vue";
	import OLED from "./OLED.vue";
	import Image from "./Image.vue";
	import { useRoute, useRouter } from 'vue-router'
	
  const router = useRouter();
	const route = useRoute();


 function gotoEditor() {
 	router.replace('/editor');
 }
 
</script>
 
<template>
<br/>
<PlayAudio />
<FileTransfer/>
<DirView/>
<Image/>
</template>

<style>


canvas {
  border:1px solid #000000;
}


</style>