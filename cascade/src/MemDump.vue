 <script setup>
  import {ref} from 'vue';
  import {sendJsonRequest, GetAttachedUint8Array, pack8bitTo7bit} from "./JsonReplyHandler.js";

  let dirList = ref([]);
  const blkSize = 20;
	let dirpath = ref("/KITS");
	
	let msgCtr = 1;
	
	let startT;
	let endT;
	let startR;
	let endR;
	let working = [];
	
	function readCallback(verb, object, data, payoff, zeroX) {
		console.log("*** Read callback");
		let params = object[verb];
		let attached = GetAttachedUint8Array(data, zeroX);
		const decoder = new TextDecoder();
		let str = decoder.decode(attached);
		console.log(str);

		let clos = {};
		clos.fid = params.fid;
 	  sendJsonRequest("close", clos, ()=>{});

	}
	

	function openCallback(verb, object, data, payoff, zeroX) {
		let resp = object[verb];
		let params = {};
		params.fid = resp.fid;
		params.addr = 0;
	  params.size = 512;
	  if (resp.fid === undefined || resp.fid < 1) {
	  	console.log("*** bad file open");
	  	return;
	  }
	  sendJsonRequest("read", params, readCallback);
	}

	
	function dumpFile() {
		let params = {};
		params.path = '/SONGS/SONG001.XML';
		params["r#"] = msgCtr++;

		sendJsonRequest("open", params, openCallback);
	}
	

	function getDump() {
		 let params = {};
		 params.addr = 0x20000000;
		 params.size = 256;
		 params.fid = 0;
		 working = [];
		 dirList.value = [];

		 sendJsonRequest("read", params);
	}
	
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
 
 <style>
 
 </style>
 