 <script setup>
  import {ref} from 'vue';
  import {sendJsonRequest} from "./JsonReplyHandler.js";
  import DirEntry from "./DirEntry.vue";

  let dirList = ref([]);
  const blkSize = 20;
	let dirpath = ref("/TEST");
	let showHidden = ref(true);
	
	function getDirInfo() {
		let working = [];
		dirList.value = [];
		let path = dirpath.value;
	
    let dirCB = function(verb, object, data, payoff) {
			let chunk = object[verb];
			working = working.concat(chunk);
		  if (chunk.length > 0) {
	
				  let params = {offset: working.length, lines: blkSize, path: path};
				  sendJsonRequest("dir", params, dirCB);
		  } else {
		  dirList.value = working;
		}
	}

		 let params = {offset: 0, lines: blkSize, path: path};
		 params.offset = 0;
		 params.lines = blkSize;
		 params.path = dirpath.value;

		 sendJsonRequest("dir", params, dirCB);
	}
	
let cdUpItem = {name: "..", attr: 0x10};

 function changeDir(child)
 {
  let oldP = dirpath.value;
  let name = child.name;
  let newP;
  if (name === "..") {
  	let splat = oldP.split('/');
  	if (splat.length > 0) splat.pop();
  	if (splat.length > 0)
  		newP = splat.join('/');
  	 else newP = '/';
  } else {
  	newP = dirpath.value + '/' + name;
  }
  console.log(newP);
  dirpath.value = newP;
  getDirInfo();
 }
 
function openPath(dEntry) {
	let fullPath = dirpath.value + '/' +  dEntry.name;
	console.log(fullPath);
}
 
</script>

<template>
<button type="button" id="getDirButton" @click="getDirInfo">Get Dir List</button><p/>
<input v-model="dirpath">&nbsp;
<input type="checkbox" id="checkbox" label="Show hidden files" v-model="showHidden">
<label for="checkbox">Show hidden</label><p/><br/>
<table>
<tr><th>[&nbsp;]</th><th>Name</th><th>Size</th></tr>
<DirEntry :entry="cdUpItem" :index="0" :cd="changeDir"/>
<template v-for="(item, index) in dirList" :key="item.name">
<tr v-if="showHidden || !(item.attr & 0x02)">
<DirEntry :entry="item" :index="index" :cd="changeDir" :open="openPath"/>
</tr>
</template>
</table>
</template>
 
<style>
 table {
  border: 1.5px solid gray;
  border-radius: 3px;
  background-color: #fff;
  border-collapse: collapse;
  }
  
  tr, td {
  border: 1px solid gray;
  }
  
  th {
   background-color: #DDD;
   border: 1px solid black;
   color: black;
   
  }
</style>
