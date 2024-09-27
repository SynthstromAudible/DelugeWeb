 <script setup>
  import {ref} from 'vue';
  import {sendJsonRequest, GetAttachedUint8Array, pack8bitTo7bit} from "./JsonReplyHandler.js";
  import {editText, editPath, setOpener, waverly} from "./common.js";
  import { useRoute, useRouter } from 'vue-router';
  
  const blockSize = 768;
  
  const router = useRouter();
	const route = useRoute();
	
  let dirList = ref([]);
	let dirpath = ref("/KITS");
	let editBlob = ref(null);
	let fullPath = ref("");
	
	let msgCtr = 1;
	
	let startT;
	let endT;
	let startR;
	let endR;
	let working;
	let highestAskedFor = 0;
	let fileAllRead = false;
	let routeTarget =  '/';
	
	function closeDone(verb, object, data, payoff, zeroX) {
		 router.replace(routeTarget);
	}
	
	async function readCallback(verb, object, data, payoff, zeroX) {
		let resp = object[verb];
		if (fileAllRead) return;

		let attached = GetAttachedUint8Array(data, zeroX);
		let blkadd = resp.addr;
		// console.log("Read addr: " + blkadd);
		if (attached.length > 0) {
			  working.set(attached, blkadd);
		
		} else {
				if (working.length > 0) {
					fileAllRead = true;
					
					if (fullPath.value.toLowerCase().endsWith('wav')) {
						const audioContext = new AudioContext();
						let decoded = await audioContext.decodeAudioData(working.buffer);
						routeTarget = '/';
						waverly(decoded);
					} else {
						const decoder = new TextDecoder();
						let str = decoder.decode(working);
						editText.value =  str;
						routeTarget = "/editor";
					}
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
		params.addr = highestAskedFor;
		highestAskedFor += blockSize;
	  params.size = blockSize;
	  sendJsonRequest("read", params, readCallback);
	  //console.log("read called");
	}


	function openCallback(verb, object, data, payoff, zeroX) {
		let resp = object[verb];
		working = new Uint8Array(resp.size);

		highestAskedFor = 0;
		fileAllRead = false;
	
		console.log("Size: " + resp.size);
		let params = {};
		params.fid = resp.fid;
		params.addr = highestAskedFor;
	  params.size = blockSize;
	  if (resp.fid === undefined || resp.fid < 1) {
	  	console.log("*** bad file open");
	  	return;
	  }
	  highestAskedFor += blockSize;

	  sendJsonRequest("read", params, readCallback);
	  console.log("Send read 1");


		if (false) {
				let param2 = {};
					param2.fid = resp.fid;
					param2.addr = highestAskedFor;
	  			param2.size = blockSize;
	  // Start another request for a little overlap.
	 			 highestAskedFor += blockSize;

	  		sendJsonRequest("read", param2, readCallback);
	  		console.log("Send read 2");
	  }
	}

	
	function dumpFile(path) {
		fullPath.value = path;
		startT = Date.now();
		let params = {};
		params.path = path;
		sendJsonRequest("open", params, openCallback);
	}
	
	setOpener(dumpFile);

	function writeCB(verb, js, data, payloadOffset, zeroX)
	{
	
	}


 	function upload() {
 		 let params = {};
		 params.addr = 0;
		 params.size = 1024;
		 let upbuf = new Uint8Array(512);
		 for (let i = 0; i < upbuf.length; ++i) {
		 	upbuf[i] = i;
		 }
	 let packed = pack8bitTo7bit(upbuf, 0, 512);
	 sendJsonRequest("write", params, writeCB, packed);
	 console.log("Request sent");
 	}
 	

 	function ping() {
 		 let pingCtr= 100;
 		 let params = {};

 		 function reping() {
 	 	 	pingCtr--;
	 	 	if (pingCtr > 0) {
	 	 		 	 sendJsonRequest("ping", params, reping);
	 	 	} else {
	 	 		endT = Date.now();
	 	 		let dT = endT - startT;
				console.log("dT: " + dT);
	 	 	}
	 	 	 //console.log("pong " + pingCtr);	 
 		 };
 		 startT = Date.now();
	 	 sendJsonRequest("ping", params, reping);
 	}
 
 </script>
 
<template>
<hr/><br/>
<button type="button" id="ping" @click="ping">Ping</button>
<button type="button" id="uploadButton" @click="upload">Upload</button>
</template>
