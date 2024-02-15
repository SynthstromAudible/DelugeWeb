"use strict";

import $ from'jquery';
import uPlot from "./js/uPlot.esm.js";
import Quadtree from "./js/quadtree.js";
import {TagInfo} from "./EventCollector.js";
import {ViewParams} from "./viewEvents.js";
import {ref, shallowRef, triggerRef} from 'vue';

let placeTable = {};

/*
 let plotInfoEntry = {
 	  type:								string  // "series", "timeline"
 		keyTag: 						string,
 		tags:  							array<string>,
 		tagToPositionMap:   new Map(),
 		data:							shallowRef(array[[array] ..]),
 		eventTable:					array<Event>
 }
*/

// Maintained in order-to-appear.

// simplifed approach

let plotInfoDir = [];

let plotDataRef = shallowRef(plotInfoDir);
let plotInfos = [];

class ViewProjector {

  constructor(scanner) {
  	this.scanner = scanner;
  	this.scaleFactor = ViewParams.timeScale;
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
						ex++;
				} else {
					done = true;
				}
			}
			tx++; // to next time column
		}
		return tsArray;
	}


genTLArray(events, tagMap) {
	let symbols = [];
	let minTime = this.scanner.minAbsTime;
	//console.log(events);
	for (let i = 0; i < events.length; ++i) {
		let evt = events[i];
		symbols.push({time: evt.absStart - minTime, dur: evt.duration, tag: evt.tag, index: evt.index, body: evt.body});
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
	  	let tagX = tagMap.get(symb.tag);
	  	yA.push(tagX);
	  	let dur = 0;
	  	if (symb.dur !== undefined && symb.dur !== 0) {
	  		dur = symb.dur;
	  	}
	  	durA.push(dur / this.scaleFactor);
	  	symB.push(symb.body);
	  }
	
		let tlArray = [timeA, yA, durA, symB];
		return tlArray;
};


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

  symbolizeTimeSeries() {
  	 let tsEvents = this.filterEvents((evt)=>evt.value != undefined && evt.value >= 0);
		 let allTSTags = this.genTagTables(tsEvents);
		 for (let i = 0; i < allTSTags.tagList.length; ++i) {
			let aTagToDo = allTSTags.tagList[i];
			let aTagEvents = this.filterEvents((evt)=>evt.tag === aTagToDo);
			let tagTablefor1 = this.genTagTables(aTagEvents);
			let aValuePlotArray = this.genTSArray(aTagEvents, tagTablefor1);
			let plotEntry = plotInfoDir.find((e)=>aTagToDo === e.keyTag);
			if (!plotEntry) {
				let tagToPositionMap = new Map();
				let tags = [aTagToDo];
				tagToPositionMap.set(aTagToDo, 0);
				plotInfoDir.push({type: "series", keyTag: aTagToDo, tags, tagToPositionMap, data: shallowRef(aValuePlotArray)});
			} else {
				plotEntry.data.value = aValuePlotArray;
			}
		}
  }
 
  symbolizeTimeline() {
 		let tlEvents = this.filterEvents((evt)=>evt.value === undefined);
		let tagTable2 = this.genTagTables(tlEvents);
		let tlData = this.genTLArray(tlEvents, tagTable2.tagMap);
		let tlTag = " Events"; // leading space is purposeful.
		let plotEntry = plotInfoDir.find((e)=>e.keyTag === tlTag);
		if (!plotEntry) {
				let tagToPosMap = new Map();
				//let tags = [tlTag];
				//tagToPosMap.set(aTagToDo, 0);
				plotInfoDir.push({type: "timeline", keyTag: " Events", tags: tagTable2.tagList, tagToPositionMap: tagTable2.tagMap, data: shallowRef(tlData)});
			} else {
				plotEntry.tags = tagTable2.tagList;
				plotEntry.tagToPositionMap = tagTable2.tagMap;
				plotEntry.data.value = tlData;
			}
  }

  symbolize() {
  	this.symbolizeTimeSeries();
  	this.symbolizeTimeline();
  	let allDatas = plotInfoDir.map((x)=>x.data.value);
 		this.alignTimes(allDatas);
 		triggerRef(plotDataRef);
  }


};

function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
    return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

function clearPlots() {
	plotInfoDir.length = 0;
	triggerRef(plotDataRef);
	
}

export {ViewProjector, clearPlots, plotDataRef};
	