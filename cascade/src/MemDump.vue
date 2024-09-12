 <script setup>
  import {ref} from 'vue';
  import {registerSysexCallback, GetAttachedUint8Array, pack8bitTo7bit} from "./JsonReplyHandler.js";
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

 	function upload() {
 		 let params = {};
		 params.addr = 0;
		 params.size = 512;
		 let upbuf = new Uint8Array(512);
		 for (let i = 0; i < upbuf.length; ++i) {
		 	upbuf[i] = i;
		 }
	 let packed = pack8bitTo7bit(upbuf, 0, 512);
	 sendJsonRequest("put", params, packed);
	 console.log("Request sent");
 	}
 
 </script>
 
<template>
<hr/><br/>
     &nbsp;
     <button type="button" id="getDumpButton" @click="getDump">Dump</button><br>
		 <button type="button" id="uploadButton" @click="upload">Upload</button><br>
 <hr/> </template>
 
 <style>
 
 </style>
 