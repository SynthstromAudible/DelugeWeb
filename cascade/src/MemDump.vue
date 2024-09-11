 <script setup>
  import {ref} from 'vue';
  import {registerSysexCallback, GetAttachedUint8Array} from "./JsonReplyHandler.js";
  import {sendJsonRequest} from "./mididriver.js";

  let dirList = ref([]);
  const blkSize = 20;
	let dirpath = ref("/KITS");
	
	let startT;
	let endT;
	let startR;
	let endR;
	let working = [];
	
	function dumpCallback(verb, object, data, payoff, zeroX) {
		console.log("*** Dump callback");
		let params = object[verb];
		let attached = GetAttachedUint8Array(data, zeroX);
		console.log(attached);
	}
	
	registerSysexCallback("dumped", dumpCallback);
	
	
	function getDump() {
		 let params = {};
		 params.addr = 0x20000000;
		 params.size = 256;
		 working = [];
		 dirList.value = [];

		 sendJsonRequest("dump", params);
	}

 </script>
 
<template>
<hr/><br/>
     &nbsp;
     <button type="button" id="getDumpButton" @click="getDump">Dump</button><br>

 <hr/> </template>
 
 <style>
 
 </style>
 