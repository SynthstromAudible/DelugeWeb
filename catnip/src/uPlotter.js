"use strict";

import $ from'jquery';
import uPlot from "./js/uPlot.esm.js";
import Quadtree from "./js/quadtree.js";
import {TagInfo} from "./EventScanner.js";
import {ViewParams} from "./viewEvents.js";

let placeTable = {};

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
	
			let cursLeft = -10;
			let cursTop = -10;

			const cursorMemo = {
				set: (left, top) => {
					cursLeft = left;
					cursTop = top;
				},
				get: () => ({left: cursLeft, top: cursTop}),
			};

 			function tooltipsPlugin(opts) {
				let cursortt;
				let seriestt;
				let {eventArray, idxOffset} = opts;
				function init(u, opts, data) {
					let over = u.over;
/*
					let tt = cursortt = document.createElement("div");
					tt.className = "tooltip";
					tt.textContent = "(x,y)";
					tt.style.pointerEvents = "none";
					tt.style.position = "absolute";
					tt.style.background = "rgba(0,0,255,0.1)";
					over.appendChild(tt);
*/
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
							let evt;
							let idxOff = idx + idxOffset;
							if (idxOff >= 0 && idxOff < eventArray.length) {

							  evt = eventArray[idxOff];
							  // console.log(evt); console.log(idxOff);
							}
							if (evt !== undefined) {
								tt.textContent = evt.body;
							} else {
								tt.textContent = "";
							}
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

class uPlotter {

  constructor(scanner) {
  	this.scanner = scanner;
  	this.scaleFactor = ViewParams.timeScale;
  }
 
	genTSArray(events, tagInfo, indexArray) {

	  if (events.length === 0) return;
		let tagCount = tagInfo.tagList.length;
		let tsArray = new Array(tagCount + 1);
		for (let t = 0; t < tsArray.length; ++t)
			tsArray[t] = [];
	
		let ex = 0;

		let tx = 0;

		while (ex < events.length)
		{
			let evt = events[ex];
			let nowT = (evt.absStart - this.scanner.minAbsTime) / this.scaleFactor;
				// fill in the array for the current time step:
			tsArray[0][tx] = nowT;
			
				// first, assume mostly missing data.
			for (let i = 0; i < tagCount; ++i) {
					tsArray[i + 1][tx] = null;
			}
	
			let done = false;
			while (ex < events.length && !done) {
				let ev2 = events[ex]
				let thisT = (ev2.absStart - this.scanner.minAbsTime) / this.scaleFactor;
				if (thisT <= nowT) {
						let tag = ev2.tag;
						let tagX = tagInfo.tagMap.get(tag);
						tsArray[tagX][tx] = ev2.value;
						indexArray[tx] = ev2.index;
						ex++;
				} else {
					done = true;
				}
			}
			tx++; // to next time column
		}
		return tsArray;
	}

	makeLineChart(o, d, tagInfo, indexArray, appendToElement) {
					if (d === undefined) {
							return;
					}
					let seriesInfo = new Array();
					let axisInfo  = new Array({});
					let title = tagInfo.tagList[0];

					seriesInfo.push({label: title});
	
					for (let i = 0; i < tagInfo.tagList.length; ++i) {
						let tag = tagInfo.tagList[i];
						let gline = {
							label: tag,
							width: 2,
							spanGaps: true,
							
				// series style
      			stroke: colorTab[i % colorTab.length],
      			//fill: "rgba(255, 0, 0, 0.3)",
      			//dash: [10, 5],
						};
						seriesInfo.push(gline);
						
						let aInfo = {
							scale: tag,
						};
					axisInfo.push(aInfo);
					}
					
				const opts = {
					width:  window.innerWidth,
					height: ViewParams.plotHeight,
					title: o.title ?? title,
					drawOrder: ["series", "axes"],
	
					scales: {
						x: {
							time: o.time ?? false,
						}
	
					},
					axes: [
						{},
						{},
					],
					
					legend: {
					//	live: false,
						markers: {
							width: 0,
						}
					},
	
				//	padding: [null, 0, null, 0],
					series: seriesInfo,
				};

				let u = new uPlot(opts, d, appendToElement);
			}

genTLArray(events, tagInfo, indexArray) {
	let symbols = [];
	let minTime = this.scanner.minAbsTime;
	//console.log(events);
	for (let i = 0; i < events.length; ++i) {
		let evt = events[i];
		symbols.push({time: evt.absStart - minTime, dur: evt.duration, tag: evt.tag, index: evt.index});
	}
	symbols.sort((a, b)=> {
				if (a.time === b.time) return 0;
				return (a.time < b.time) ? -1 : 1;
			});

		let timeA = [];
		let yA = [];
		let durA = [];
		let symB = [];

	  for (let i = 0; i < symbols.length; ++i) {
	  	let symb = symbols[i];
	  	timeA.push(symb.time / this.scaleFactor);
	  	let tagX = tagInfo.tagMap.get(symb.tag);
	  	indexArray.push(symb.index);
	  	yA.push(tagX);
	  	let dur = 0;
	  	if (symb.dur !== undefined && symb.dur !== 0) {
	  		dur = symb.dur;
	  	}
	  	durA.push(dur / this.scaleFactor);
	  	symB.push(symbols.index);
	  }
	
		let tlArray = [timeA, yA, durA];
		return tlArray;
};


	makeTimelineChart(o, d, tagInfo, eventArray) {
					//if (d === undefined) {
					//		$("#uplotl").empty();
					//		return;
					//}

					let seriesInfo = new Array();
					//let qt;
					let dpr = devicePixelRatio;
					// Since we may have added an empty column to the front of the data array
					// for timing alignment, that can throw off
					// our index by 1, check for that now and setup adjustment.
					let indexOffset = -1;
					for (let x = 1; x < d.length; ++x) {
						if (d[x][0] !== undefined) {
								indexOffset = 0;
						}
					}

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

							let xT = Math.round(cx - xOff);
							let yT = Math.round(cy - yOff);
							let eva = eventArray[j];
							let tv = "";
							if (eva !== undefined) tv =eva.tag;
							//console.log("x " + xT + " Y " + yT + " W " + w + " didx " + j + " " + tv);
/*				
							if (qt !== undefined)
  						qt.add({
								x: xT,
								y: yT,
								w: w,
								h: 16,
								sidx: sidx,
								didx: j
							});
*/
  					ctx.restore();
						}
						j++;
					};
					ctx.restore();
		};

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
	
				let tlh = tagInfo.tagList.length * 20 + 50;
				
				let tagNames = tagInfo.tagList;
				let tagYs = [];
				for (let i = 0; i < tagInfo.tagList.length; ++i) {
					tagYs.push(tagInfo.tagMap.get(tagInfo.tagList[i]));
				}

				let idxOffset = 0;
				if (d.length > 1 && (d[1][0] === undefined || d[1][0] === null)) idxOffset = -1;
	
				let opts = {
					width:  window.innerWidth,
					height: tlh,
					title: o.title ?? "Events",
					drawOrder: ["series", "axes"],
	/*
					cursor: {
							dataIdx: (u, seriesIdx, closestIdx, xValue) => {
									let cx = Math.round(u.cursor.left * dpr);
									let cy = Math.round(u.cursor.top * dpr);
									if (seriesIdx == 0 || qt === undefined) return closestIdx;
									console.log("seeking: " + closestIdx + " " +  eventArray[closestIdx].tag + " x " + cx + " y " + cy);
									qt.get(cx, cy, 1, 1, o => {
										if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h)) {
												if (o.didx !== undefined)	{
													 console.log("found :" + o.didx);
														return o.didx;
													}
												else return closestIdx;
										} // if
									}); // cb
									return closestIdx;
								},
					}, // end cursor 
*/
					spanGaps: false,
					scales: {
						x: {
							time: o.time ?? false,
						}
	
					},
					axes: [
						{},
						{values: (u, splits)=>{
							return tagNames;
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
	
					plugins: [
						tooltipsPlugin({
							eventArray,
							cursorMemo,
							idxOffset,
							/*
							drawClearFunction: function(u)  {
								qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);
								qt.clear();
							},
							*/
						})
					],
					
					series: seriesInfo,
				}; // end opts

				let place = placeTable['timelinePlot'];
				$(place).empty();
				let u = new uPlot(opts, d, place);
			}

  tagMinMax(events) {
  	let tagTab = new Map();
 	 		for (let i=0; i < events.length; ++i) {
 	 			let evt = events[i];
	 			let tag = evt.tag;
	 			if (tag !== undefined && !tagTab.has(tag)) {
	 				tagTab.set(tag, new TagInfo());
	 			}
	
  		let tinfo = tagTab.get(tag);
  		tinfo.updateForEvent(evt);
  	}
  	return tagTab;
  }

	filterEvents(filtfun) {
			let filtered = [];
			for (let i=0; i < this.scanner.events.length; ++i) {
				let evt = this.scanner.events[i];
				if (filtfun(evt)) {
					filtered.push(evt);
				}
			}
		  filtered.sort((a, b)=> {
				if (a.absStart === b.absStart) return 0;
				return (a.absStart < b.absStart) ? -1 : 1;
			});
			this.scanner.matchEndings(filtered);
			//let tsArray = this.genTSArray(filtered);
			//console.log(tsArray);
			return filtered;
	}

	 genTagTables(events)
	 {
	 	  let tagInfoList = this.tagMinMax(events);

	 		let tagList = Array.from(tagInfoList.keys());
	 		tagList.sort();
	
			let tagMap = new Map();
	 		for (let i = 0; i < tagList.length; ++i) {
	 			tagMap.set(tagList[i], i + 1);
	 		}
	 		return {tagList, tagMap, tagInfoList};
	 }

	alignTimes(tm) {
		let minV = Number.MAX_VALUE;
		let maxV = Number.MIN_VALUE;
		for (let lm = 0; lm < tm.length; ++lm) {
			let m = tm[lm];
			if (m === undefined) continue;
			if (m[0][0] < minV) {
				minV = m[0][0];
			}
			let lastX = m[0].length - 1;
			if (m[0][lastX] > maxV) {
				maxV = m[0][lastX];
			}
		}

		for (let lm = 0; lm < tm.length; ++lm) {
			let m = tm[lm];
			if (m === undefined) continue;
			if (m[0][0] > minV) {
				m[0].unshift(minV);
				for (let r = 1; r < m.length; ++r) {
					m[r].unshift(null);
				}
			}
			let lastX = m[0].length - 1;
			if (m[0][lastX] < maxV) {
					m[0].push(maxV);
					for (let r = 1; r < m.length; ++r) {
						m[r].push(null);
				}
			}
		}
	}

  plotEverything() {
  	
		let place1 = placeTable["valuePlots"];
		if (place1 === undefined) return;

  	let performance = window.performance;
    let rstart = performance.now();
  	let tsEvents = this.filterEvents((evt)=>evt.value != undefined && evt.value >= 0);
  	
  	let allTSTags = this.genTagTables(tsEvents);
	
		let allPlotsMade = [];
		let allTSPlotData = [];
		// For each tab in the values table list, break into subplots
		for (let i = 0; i < allTSTags.tagList.length; ++i) {
			let aTagToDo = allTSTags.tagList[i];
			let aTagEvents = this.filterEvents((evt)=>evt.tag === aTagToDo);
			let tagTablefor1 = this.genTagTables(aTagEvents);
			let indexArray = [];
			let aValuePlotArray = this.genTSArray(aTagEvents, tagTablefor1, indexArray);
			allTSPlotData.push({aValuePlotArray, tagTablefor1, indexArray});
			allPlotsMade.push(aValuePlotArray);
		}

		let tlEvents = this.filterEvents((evt)=>evt.value === undefined);
		let tagTable2 = this.genTagTables(tlEvents);
		let indexArray = [];
		let tlData = this.genTLArray(tlEvents, tagTable2, indexArray);
		allPlotsMade.push(tlData);
		this.alignTimes(allPlotsMade);

		$(place1).empty();

		for (let x = 0; x < allTSPlotData.length; ++x) {
  			this.makeLineChart({mode: 1}, allTSPlotData[x].aValuePlotArray, allTSPlotData[x].tagTablefor1, allTSPlotData[x].indexArray, place1);
  	}

		this.makeTimelineChart({mode: 1, spanGaps: false}, tlData, tagTable2, tlEvents);
		let rend = performance.now();
    //console.log("Time to render uPlot: " + (rend - rstart));
  }
};

function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
    return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

function reportElement(id, elem) {
	console.log("id= " + id + " element= " + elem);
	placeTable[id] = elem;
}

export {uPlotter, reportElement};
	