 <script setup>
  import {ref} from 'vue';
  import {sendJsonRequest} from "./JsonReplyHandler.js";
  import DirEntry from "./DirEntry.vue";
  import {openEditOn, editPath} from "./common.js";
  import {getDirInfo} from "./FileRoutines.js";

  let dirList = ref([]);
	let dirpath = ref("/");
	let showHidden = ref(true);

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
  getDirInfo(newP, (err, plist)=>{
  		dirList.value = plist;
  });
 }
 
function openPath(dEntry) {
	let fullPath = dirpath.value + '/' +  dEntry.name;
	console.log(fullPath);
	openEditOn(fullPath);
}

function dirGetter() {
   getDirInfo(dirpath.value, (err, plist)=>{
  		dirList.value = plist;
  	});
}

</script>

<template>
<button type="button" id="getDirButton" @click="dirGetter">Get Dir List</button><p/>
<input v-model="dirpath">&nbsp;
<input type="checkbox" id="checkbox" label="Show hidden files" v-model="showHidden">
<label for="checkbox">Show hidden</label><p/><br/>
<table><tbody>
<tr><th>[&nbsp;]</th><th>Name</th><th>Size</th></tr>
<DirEntry :entry="cdUpItem" :index="0" :cd="changeDir"/>
<template v-for="(item, index) in dirList" :key="item.name">
<tr v-if="showHidden || !(item.attr & 0x02)">
<DirEntry :entry="item" :index="index" :cd="changeDir" :open="openPath"/>
</tr>
</template>
</tbody></table>
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
