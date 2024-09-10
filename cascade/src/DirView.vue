 <script setup>
  import {setJsonCallback} from "./mididriver.js";
  import {onMounted, ref} from 'vue';
  import {notifyRef} from "./JsonReplyHandler.js";
  import DirEntry from "./DirEntry.vue";

  let dirList = ref([]);

   onMounted(() => {
	});
	notifyRef(dirList);
 </script>
 
 <template>
 <hr/><br/>
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
 export {dirList};