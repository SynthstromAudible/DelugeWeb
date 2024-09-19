 <script setup>
  import {ref} from 'vue';
  import {sendJsonRequest, GetAttachedUint8Array, pack8bitTo7bit} from "./JsonReplyHandler.js";
  import {editText, setOpener} from "./common.js";
  import { useRoute, useRouter } from 'vue-router';
  
  
  const router = useRouter();
	const route = useRoute();
	
  let dirList = ref([]);
  const blkSize = 20;
	let dirpath = ref("/KITS");
	
	let msgCtr = 1;
	
	let startT;
	let endT;
	let startR;
	let endR;
	let working;
	let workingAddr = 0;
	
	function closeDone(erb, object, data, payoff, zeroX) {
		router.replace('/editor');
	}
	
	function readCallback(verb, object, data, payoff, zeroX) {
		let resp = object[verb];
		let attached = GetAttachedUint8Array(data, zeroX);
		if (attached.length > 0) {
			  working.set(attached, workingAddr);
		} else {
				if (working.length > 0) {
					const decoder = new TextDecoder();
					let str = decoder.decode(working);
					editText.value =  str;
				}
				let clos = {};
				clos.fid = resp.fid;
 	  		sendJsonRequest("close", clos, closeDone);
 	  		endT = Date.now();
 	  		let dT = endT - startT;
 	  		console.log("dT: " + dT);
 	  		return;
		}
		let params = {};
		params.fid = resp.fid;
		params.addr = workingAddr += resp.size;
	  params.size = 512;
	  sendJsonRequest("read", params, readCallback);
	  //console.log("read called");
	}


	function openCallback(verb, object, data, payoff, zeroX) {
		let resp = object[verb];
		working = new Uint8Array(resp.size);
		console.log("Size: " + resp.size);
		let params = {};
		params.fid = resp.fid;
		params.addr = 0;
	  params.size = 512;
	  if (resp.fid === undefined || resp.fid < 1) {
	  	console.log("*** bad file open");
	  	return;
	  }
	  sendJsonRequest("read", params, readCallback);
	  console.log("read called from open.");
	}

	
	function dumpFile(path) {
		startT = Date.now();
		let params = {};
		params.path = path;
		workingAddr = 0;
		sendJsonRequest("open", params, openCallback);
	}
	
	setOpener(dumpFile);

	function writeCB(verb, js, data, payloadOffset, zeroX)
	{
	
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
	 sendJsonRequest("write", params, writeCB, packed);
	 console.log("Request sent");
 	}
 
 </script>
 
<template>
<hr/><br/>
<button type="button" id="getDumpButton" @click="dumpFile">Dump File</button>
<button type="button" id="uploadButton" @click="upload">Upload</button>
</template>
