 <script setup>
  import {ref} from 'vue';
  import {sendJsonRequest} from "./JsonReplyHandler.js";
  import DirEntry from "./DirEntry.vue";

  let dirList = ref([]);
  const blkSize = 20;
	let dirpath = ref("/TEST");
	
	let startT;
	let endT;
	let startR;
	let endR;
	let working = [];
	
	function dircallback(verb, object, data, payoff) {
		let chunk = object[verb];
		working = working.concat(chunk);
		endR = Date.now();
		if (startR !== undefined) {
			let dTR =  endR - startR;
			console.log("reqDT: " + dTR);
		}
		if (chunk.length > 0) {
					let params = {};
		 			params.offset = working.length;
					params.lines = blkSize;
					params.path = dirpath.value;
				  sendJsonRequest("dir", params, dircallback);
				  startR = Date.now();
		} else {
		  dirList.value = working;
			endT = Date.now();
			let dT = endT - startT;
			console.log(" dT: " + dT);
		}
	}

	function getDirInfo() {
		 let params = {};
		 params.offset = 0;
		 params.lines = blkSize;
		 params.path = dirpath.value;
		 working = [];
		 dirList.value = [];

		 sendJsonRequest("dir", params, dircallback);
	}
		

 
function loadDir() {
	startT = Date.now();
	getDirInfo();
}
	
 </script>
 
<template>
<hr/><br/>
     &nbsp;
     <button type="button" id="getDirButton" @click="loadDir">Get Dir List</button><br>
<table>
<tr><th>Name</th><th>Size</th></tr>
<tr v-for="(item, index) in dirList" :key="item.name" >
<DirEntry :entry="item"/>
</tr>
</table>

 <hr/>
 </template>
 
 <style>
 
 </style>
