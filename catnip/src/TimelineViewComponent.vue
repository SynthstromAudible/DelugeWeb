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
    import {shallowRef, ref, watch, onMounted} from 'vue';
    import uPlot from 'uplot';
    import UplotVue from 'uplot-vue';
    import 'uplot/dist/uPlot.min.css';
    import {plotDataRef} from "./ViewProjector.js"
    import {ViewParams} from "./viewEvents.js"

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
	
 
 const props = defineProps({keyTag: String});
 
 const data = shallowRef([[], []]);
 
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
  	 updateTagInfo();
 	 });
 
  let tagList = dataIn.tags;
	let tagYs;
	let timelineHeight = tagList.length * 20 + 50;
	

	onMounted(()=>updateTagInfo());

	 function updateTagInfo() {

	 			tagList = dataIn.tags;
	 			tagYs = [];
				for (let i = 0; i < tagList.length; ++i) {
					tagYs.push(dataIn.tagToPositionMap.get(tagList[i]));
				}

				timelineHeight = tagList.length * 20 + 50;
				if (options.height !== timelineHeight) {
					let newOpts = {...options};
					newOpts.height = timelineHeight;
					options = newOpts;
				}
    }
 
 
	let cursLeft = -10;
	let cursTop = -10;

	const cursorMemo = {
			set: (left, top) => {
					cursLeft = left;
					cursTop = top;
			},
			get: () => ({left: cursLeft, top: cursTop}),
	};

	function drawPoints(u, sidx, i0, i1) {
		let { ctx, width } = u;
		let { _stroke, scale, min, max} = u.series[sidx];
		let xR = max - min;
		//let scaleFact = this.viewer.scaleFactor;
		ctx.save();

		ctx.fillStyle = _stroke;

		let j = i0;
		let xOff = u.bbox.left;
		let yOff = u.bbox.top;

		while (j <= i1) {					
			let {min, max} = u.scales["x"];
			let val = u.data[sidx][j];
			if (val !== undefined && val !== null) {
				let dur = u.data[sidx + 1][j];
				if (dur === undefined || dur === null) dur = 0;
				let xRaw = u.data[0][j];
				let xRawEnd = xRaw + dur;
				let cx = Math.round(u.valToPos(xRaw, 'x', true));
				let cxend = Math.round(u.valToPos(xRawEnd, 'x', true));
				let xDur = cxend - cx;
				let cy = Math.round(u.valToPos(val, scale, true));

				ctx.save();
				ctx.fillStyle = colorTab[val % colorTab.length];
				let w = Math.max(8, xDur);
				ctx.fillRect(cx, cy - 8, w, 16);
				ctx.restore();
		  }
		j++;
	 };
	ctx.restore();
	};
			let seriesInfo = new Array();
			seriesInfo.push({label: "Events"});
			let gline = {
					width: 3,
					label: "events",
					spanGaps: false,
					points: {
						show: drawPoints,
					},
				 // fill:   (seriesIdx, dataIdx, value) => colorTab[0 % colorTab.length],
					 stroke: (seriesIdx, dataIdx) => {
						return colorTab[1 % colorTab.length];
					},
						paths: (a, b, c, d, e, f)=> {
							 null // stops line drawing across events.
							},
						lineInterpolation: null,
				};
				seriesInfo.push(gline);

				let idxOffset = 0;
				if (data.length > 1 && (d[1][0] === undefined || data[1][0] === null)) idxOffset = -1;
	
				let options = {
					width:  window.innerWidth - 64,
					height: timelineHeight,
					title: "Events",
					drawOrder: ["series", "axes"],
					spanGaps: false,
					scales: {
						x: {
							time: false,
						}
	
					},
					axes: [
						{},
						{values: (u, splits)=>{
							return tagList;
						  },
						 splits: () => { return tagYs}
						} 
					],

					legend: {
						show: false,
						markers: {
							width: 2,
						},			
					},
					series: seriesInfo,
					
				plugins: [
						tooltipsPlugin({
						cursorMemo,
						idxOffset,
		 				})
		 		]
		 		
				}; // end opts



 			function tooltipsPlugin(opts) {
				let cursortt;
				let seriestt;
				let {idxOffset} = opts;
				function init(u, opts, data) {
					let over = u.over;
					seriestt = opts.series.map((s, i) => {
						if (i == 0) return;

						let tt = document.createElement("div");
						tt.className = "tooltip";
						tt.textContent = "Tooltip!";
						tt.style.pointerEvents = "none";
						tt.style.position = "absolute";
						tt.style.background = "rgba(0,0,0,0.1)";
						tt.style.color = s.color;
						over.appendChild(tt);
						return tt;
					});

					function hideTips() {
						//cursortt.style.display = "none";
						seriestt.forEach((tt, i) => {
							if (i == 0) return;

							tt.style.display = "none";
						});
					}

					function showTips() {
						//cursortt.style.display = null;
						seriestt.forEach((tt, i) => {
							if (i == 0) return;

							let s = u.series[i];
							tt.style.display = s.show ? null : "none";
						});
					}

					over.addEventListener("mouseleave", () => {
						if (!u.cursor._lock) {
						//	u.setCursor({left: -10, top: -10});
							hideTips();
						}
					});

					over.addEventListener("mouseenter", () => {
						showTips();
					});

					if (u.cursor.left < 0)
						hideTips();
					else
						showTips();
				}

				function setCursor(u) {
					let {left, top, idx} = u.cursor;

					opts?.cursorMemo?.set(left, top);

					// this is here to handle if initial cursor position is set
					// not great (can be optimized by doing more enter/leave state transition tracking)
				//	if (left > 0)
				//		u.cursortt.style.display = null;

					//cursortt.style.left = left + "px";
					//cursortt.style.top = top + "px";
					//cursortt.textContent = "(" + u.posToVal(left, "x").toFixed(2) + ", " + u.posToVal(top, "y").toFixed(2) + ")";

					// can optimize further by not applying styles if idx did not change
					seriestt.forEach((tt, i) => {
						if (i == 0) return;

						let s = u.series[i];

						if (s.show) {
							// this is here to handle if initial cursor position is set
							// not great (can be optimized by doing more enter/leave state transition tracking)
						//	if (left > 0)
						//		tt.style.display = null;

							let xVal = u.data[0][idx];
							let yVal = u.data[i][idx];
							if (u.data[i, 0] === undefined) {
								idx--;
							}
							let text = "";
							let idxOff = idx + idxOffset;
							if (idxOff >= 0 && idxOff < u.data[3].length) {

							  text = u.data[3][idxOff];
							  // console.log(evt); console.log(idxOff);
							}
		
							tt.textContent = text;

							tt.style.left = Math.round(u.valToPos(xVal, 'x')) + "px";
							tt.style.top = Math.round(u.valToPos(yVal, s.scale)) + "px";
						}
					});
				}

				return {
					hooks: {
						init,
						setCursor,
						//drawClear: 	drawClearFunction,
						setScale: [
							(u, key) => {
								//console.log('setScale', key);
							}
						],
						setSeries: [
							(u, idx) => {
								//console.log('setSeries', idx);
							}
						],
					},
				};
			}











 </script>