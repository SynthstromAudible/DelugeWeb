<template>
<table>
<div v-for="(item, index) in plotDataRef" :key="item.keyTag" >
<tr><td>
  <div v-if="item.type == 'series'">
		<SeriesViewComponent :keyTag="item.keyTag" />
	</div>
	<div v-else>
	  <TimelineViewComponent :keyTag="item.keyTag" />
	</div>
	</td></tr>
</div>
</table>
<p/>
</template>

<script setup>
    import {plotDataRef} from "./ViewProjector.js";
    import SeriesViewComponent from "./SeriesViewComponent.vue";
    import TimelineViewComponent from "./TimelineViewComponent.vue"
</script>