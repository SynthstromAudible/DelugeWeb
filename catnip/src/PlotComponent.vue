<script setup>

import {defineProps, ref, onMounted} from 'vue';

const props = defineProps({useId: String});

const plotelm  = ref(null)
let plotElement;
 onMounted(() => {
        plotElement = plotelm.value;
        console.log(plotElement);
})

</script>

<template>
<div :id="useId" ref='plotelm'>
</div>
</template>

