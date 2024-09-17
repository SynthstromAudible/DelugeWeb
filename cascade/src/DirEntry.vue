 <script setup>
  import {onMounted, ref} from 'vue';

  const props = defineProps({
  cd:	 Function,
  open: Function,
  entry: Object,
  index: Number
	});
	
	function decb(p1) {
	 console.log(p1.name);
	}
	
  </script>
  
  <template>
  <td><input type="checkbox" :id="'cb' + index" @click="decb(entry)"></td>
  <template v-if="entry.attr & 0x10">
  <td style="min-width:500px" @click="cd(entry)">{{entry.name}}/</td><td></td>
  </template>
  <template v-else>
  <td style="min-width:500px" @click="open(entry)">{{entry.name}}</td><td>{{entry.size}}</td>
  </template>
  </template>
  
  