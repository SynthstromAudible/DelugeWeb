<template>
    <UplotVue
        :data="data"
        :options="options"
    />
 </template>
//        @create="onCreate"
//        @delete="onDelete"
//        :target="target"
 <script setup>
    // Vue.js 3
    import {createApp, shallowRef, ref, watch, onMounted, onUnmounted} from 'vue';
    import uPlot from 'uplot';
    import UplotVue from 'uplot-vue';
    import 'uplot/dist/uPlot.min.css';
    import {plotDataRef} from "./ViewProjector.js"
    import {ViewParams} from "./viewEvents.js"
 
 
 const props = defineProps({keyTag: String});
 const data = shallowRef([[], []]);
 
	let colorTab = [
	 "red",
	 "green",
	 "blue",
	 "yellow",
	 "black",
	 "orange",
	 "cyan",
	 "gray"
	];

	 function indexForTag(tag) {
 		return plotDataRef.value.findIndex((v)=>v.keyTag === tag);
 }
 
 let indexPos = indexForTag(props.keyTag);
 if (indexPos < 0) {
 	console.log("Tag not found in plotDataRef " + props.keyTag);
 }
 
 let dataIn = plotDataRef.value[indexPos];
 	data.value = dataIn.data.value;

	const w = watch(dataIn.data, ()=> {
		 let inx = indexForTag(props.keyTag);
		 if (inx < 0) {
		 	  console.log("Tag not found in plotDataRef watch: " + props.keyTag);
		 }
 		dataIn = plotDataRef.value[inx];
  	data.value = dataIn.data.value;
 	});
 	
 
 	onMounted(() => {
     console.log("mounted");
	})

 	onUnmounted(() => {
 		console.log("unmounted");
 	});


  let tagList = dataIn.tags;
 
 	let title = tagList[0];

	let seriesInfo = new Array();
	let axisInfo  = new Array({});

	seriesInfo.push({label: title});

	for (let i = 0; i < tagList.length; ++i) {
			let tag = tagList[i];
			let gline = {
					label: tag,
					width: 2,
					spanGaps: true,
				// series style
      	stroke: colorTab[(i + indexPos) % colorTab.length],
			};
			seriesInfo.push(gline);		
			let aInfo = {scale: tag};
			axisInfo.push(aInfo);
		}
					
		const options = {
			width:  window.innerWidth - 64,
			height: ViewParams.plotHeight,
			title: 	title,
			drawOrder: ["series", "axes"],
	
			scales: {
						x: {time: false,
						}
					},
			axes: [
						{},
						{},
			],

			legend: {
				markers: {
						width: 0,
				}
			},
			series: seriesInfo,
		};

 </script>