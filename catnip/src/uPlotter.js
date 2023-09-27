"use strict";


    
import $ from'jquery';

import uPlot from "./js/uPlot.esm.js";
import timelinePlugin from "./js/timelinePlugin.js";

class TagInfo {
	  constructor() {
	  	this.ybase = 0;
			this.reset();
	  }

	  reset() {
	  	this.minTime = Number.MAX_VALUE;
	  	this.maxTime = Number.MIN_VALUE;
	  	this.minRange = Number.MAX_VALUE;
	  	this.maxRange = Number.MIN_VALUE;
	  	this.eventCount = 0;
	  	this.hasTSData = false;
	  }

		updateForEvent(evt) {
				if (evt.value !== undefined) {
					this.hasTSData = true;
          if (evt.value < this.minRange) {
          		this.minRange = evt.value;
          }
          if (evt.value > this.maxRange) {
          		this.maxRange = evt.value; 
          }
        }
       if (evt.absTime < this.minTime) {
          this.minTime = evt.absTime;
       }
       if (evt.absTime > this.maxTime) {
          this.maxTime = evt.absTime; 
       }
      this.eventCount++;
		}
}

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
	

class uPlotter {

  constructor(viewer) {
  	this.viewer = viewer;
  	this.scaleFactor  = viewer.timeScale;
  }
 
	genTSArray(events, tagInfo) {

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
			let nowT = (evt.absStart - this.viewer.minAbsTime) / this.scaleFactor;
				// fill in the array for the current time step:
			tsArray[0][tx] = nowT;
				// first, assume mostly missing data.
			for (let i = 0; i < tagCount; ++i) {
					tsArray[i + 1][tx] = null;
			}
	
			let done = false;
			while (ex < events.length && !done) {
				let ev2 = events[ex]
				let thisT = (ev2.absStart - this.viewer.minAbsTime) / this.scaleFactor;
				if (thisT <= nowT) {
						let tag = ev2.tag;
						let tagX = tagInfo.tagMap.get(tag);
						tsArray[tagX][tx] = ev2.value;
						ex++;			
				} else {
					done = true;
				}
			}
			tx++; // to next time column
		}
		return tsArray;
	}

	makeLineChart(o, d, tagInfo, appendToElement) {
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
					height: this.viewer.plotHeight,
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

	
genTLArray(events, tagInfo) {
    if (events.length === 0) return;
    let tagCount = tagInfo.tagList.length;
    let tsArray = new Array(tagCount + 1);
    for (let t = 0; t < tsArray.length; ++t) {
        tsArray[t] = [];
		}
    let eventsInProgress = new Map();
    let ex = 0;
    let nowT = (events[0].absStart - this.viewer.minAbsTime);

    let tx = 0;
 
    while (ex < events.length || eventsInProgress.length > 0) {
        let evt;
        if (ex < events.length) {
        	evt = events[ex];
        	nowT = (evt.absStart - this.viewer.minAbsTime);
        }

        eventsInProgress.forEach((v, k) => {
            if (v < nowT) nowT = v;
        });

        // remove events that have concluded.
        eventsInProgress.forEach((v, k) => {
            if (v <= nowT) {
            	 eventsInProgress.delete(k);
            	}
        });

        let done = false;
        while (ex < events.length && !done) {
            let ev2 = events[ex];
            let thisT = (ev2.absStart - this.viewer.minAbsTime);
            if (thisT <= nowT) {
            	  let dur = evt.duration;
            		if (dur === 0) dur++;
                //console.log("thisT " + thisT + " dur " + endT);
                eventsInProgress.set(ev2.tag, thisT + dur);
                ex++;
            } else done = true;
        }

        // fill in all events that occur at or before this time.
        tsArray[0][tx] = nowT / this.scaleFactor;
        // first, assume missing data.
        for (let i = 0; i < tagCount; ++i) {
            tsArray[i + 1][tx] = null;
        }

				if (eventsInProgress.length === 0) {
					console.log("Gap at: " + nowT);
				}
        // ... then 'paint in' all the events in progress.
        eventsInProgress.forEach((v, k) => {
            let tagX = tagInfo.tagMap.get(k);
            tsArray[tagX][tx] = tagX;
        });
        tx++;
    }

    // Close out the timeline with all missing values.
    /*
     tsArray[0].push(lastT + 1);
     for (let i = 0; i < tagCount; ++i) {
         tsArray[i + 1].push(null);
     }
*/
    return tsArray;
}


	makeTimelineChart(o, d, tagInfo) {
					if (d === undefined) {
							$("#uplotl").empty();
							return;
					}
					let seriesInfo = new Array();
					seriesInfo.push({label: "Events"});

					for (let i = 0; i < tagInfo.tagList.length; ++i) {
						let tag = tagInfo.tagList[i];
						let gline = {
							label: tag,
							width: 3,
							spanGaps: false,
							points: {
								show: true,
							},
							
				// series style
      			stroke: colorTab[i % colorTab.length],
      			//fill: "rgba(255, 0, 0, 0.3)",
      			//dash: [10, 5],
						};
						seriesInfo.push(gline);
					}
				let dat = d;
				let tlh = tagInfo.tagList.length * 20 + 50;
				let opts = {
					width:  window.innerWidth,
					height: tlh,
					title: o.title ?? "Events",
					drawOrder: ["series", "axes"],
					spanGaps: false,
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
						live: false,
						markers: {
							width: 2,
						}
					},
	
				//	padding: [null, 0, null, 0],
					series: seriesInfo,
				};

				$("#uplotl").empty();
				if (false) {
				  opts["plugins"] = [
						timelinePlugin({
							count: dat.length - 1,
							...o,
								fill:   (seriesIdx, dataIdx, value) => colorTab[seriesIdx % colorTab.length],
								stroke: (seriesIdx, dataIdx, value) => colorTab[seriesIdx % colorTab.length]
						})
					];
				}
				let u = new uPlot(opts, d, $("#uplotl")[0]);
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
			for (let i=0; i < this.viewer.events.length; ++i) {
				let evt = this.viewer.events[i];
				if (filtfun(evt)) {
					filtered.push(evt);
				}
			}
		  filtered.sort((a, b)=> {
				if (a.absStart === b.absStart) return 0;
				return (a.absStart < b.absStart) ? -1 : 1;
			});
			this.viewer.matchEndings(filtered);
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
			let aValuePlotArray = this.genTSArray(aTagEvents, tagTablefor1);
			allTSPlotData.push({aValuePlotArray, tagTablefor1});
			allPlotsMade.push(aValuePlotArray);
		}

		let tlEvents = this.filterEvents((evt)=>evt.value === undefined);
		let tagTable2 = this.genTagTables(tlEvents);
		let tlData = this.genTLArray(tlEvents, tagTable2);
		allPlotsMade.push(tlData);
		this.alignTimes(allPlotsMade);
		$("#uplot").empty();
		for (let x = 0; x < allTSPlotData.length; ++x) {
  			this.makeLineChart({mode: 1}, allTSPlotData[x].aValuePlotArray, allTSPlotData[x].tagTablefor1, $("#uplot")[0]);
  	}

		this.makeTimelineChart({mode: 2, spanGaps: false}, tlData, tagTable2);
		
		let rend = performance.now();
    //console.log("Time to render uPlot: " + (rend - rstart));
  }
};

export {uPlotter, TagInfo};
	