 <script setup>
  import {onMounted, ref} from 'vue';
  const props = defineProps({
  entry: Object
	})
  </script>
  
  <template>
  <td>{{entry.name}}</td><td>{{entry.size}}</td><td>{{entry.attr}}</td>
  </template>
  
  