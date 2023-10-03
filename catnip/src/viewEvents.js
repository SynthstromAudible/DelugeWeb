"use strict";

import $ from'jquery';
import {setSysExCallback, sysExRunning} from "./mididriver.js";
import uPlot from "./js/uPlot.esm.js";
import {uPlotter, TagInfo} from "./uPlotter.js";
import {jPlot} from "./jPlot.js";
//import { createApp } from 'vue';
//import App from './App.vue';


var activeView;
// We must also update the 'selected' attribute in the dropdown element in the html file.
var lastTimeScale = 400000000;

var lastPlotHeight = 100;

// Test data:
let rttcapture =
`00> 64E7576E,00200000 Meow
00> 64E76C00 cows
00> 64E76C1E uS per 320 samples: 15
00> 6505A000 ~cows
00> 6505ABCA uS per 320 samples: 11
00> 65CC5990 uS per 320 samples: 49
00> 665F01E9 uS per 320 samples: 159
00> 665F31E9 fur 100
00> 665F3200 Cats
00> 665F32FF uS per 320 samples: 112
00> 66E74C00,00100000 fur
00> 66E761E9 fur 20
00> 66E76C1E uS per 320 samples: 15
00> 66E7A000 ~cows
00> 66E7A040,00010000 Callie
00> 66FF3200,00200000 Cats
00> 66FF8200 Purrs
00> 67FF8900 fur 130
`

let simplecap =
`00> 64E7576E,00200000 Meow
00> 65CC5990 uS per 320 samples: 49
00> 665F01E9 uS per 320 samples: 159
00> 66E7A040,00010000 Callie
00> 64E76C00 cows
00> 64E76C1E uS per 320 sampl
`
let regex = /[0-9A-Fa-f]{8}/g;
function parseHex(string)
{
  if (string.match(regex)) {
    return parseInt(string, 16);
  }
  return NaN;
}

// Check for a valid number in a string.
// thanks to https://makersaid.com/check-if-string-is-number-javascript/#google_vignette 
function isStrictlyNumeric(val) {
    if(val === "" || val === " " || val === null || typeof val === 'boolean') {
        return false;
    }
    return !isNaN(Number(val));
}


const match1 = /^([0-9A-Fa-f]{8})/;
const match2 = /^([0-9A-Fa-f]{8}),([0-9A-Fa-f]{8})/;
const splitspaceorcomma = /[\s,]+/;

class EventScanner
{
  constructor() {

    this.events = [] ;
    this.firstTime = true;
    this.baseTime = 0;
    this.lastBaseTime = 0;
    this.armed = false;
    this.previousStamp = 0;
    this.badLines = 0;
    this.trackSet = new Set();
    this.trackOrder = [];
    this.trackMap = new Map();
    this.tagInfoTable = new Map();
    this.tagOrderOfAppearance = [];
    this.tagsToTrackNumber = new Map();
    this.timeSeriesTags = new Map();
    this.timeLineTags = new Map();
    this.maxRange = new Map();
    this.minRange = new Map();
    this.minAbsTime = Number.MAX_VALUE;
    this.maxAbsTime = Number.MIN_VALUE;
    this.flipped = true;
    this.maxY = 0;
    this.plotHeight = lastPlotHeight;
    this.laneHeight = 16;
    this.timeScale = lastTimeScale;
    this.captureStart = Date.now();

  }

  parseLine(inbuffer)
  {
    let maxLen = inbuffer.length;
  
    if ( inbuffer.length < 4) return;
    // If we are dealing with RTT data, skip the terminal indicator part.
    if (inbuffer[2] === '>') {
    	inbuffer = inbuffer.substring(4, inbuffer.length);
    }

		let charOff = 0;
		let tsa, tsb = 0;
		let kind = 0;

  	let matches = inbuffer.match(match2);
  	if (matches !== null && matches.length >= 2)
  	{
  		charOff = 17; kind = 2;
  		tsa = parseHex(matches[1]);
  		tsb = parseHex(matches[2]);
  	} else {
  		matches = inbuffer.match(match1);
  		if (matches !== null && matches.length > 1) {
  			charOff = 8; kind = 1;
  			tsa = parseHex(matches[1]);
  		}
  	}
		if (matches === null) return;
    let body = inbuffer.substring(charOff, inbuffer.length).trim();

		// if body is a full-blown 8 digit hex number, it probably means a buffer overrun
		// and we should reject this line. This won't catch then all, but it is better than nothing.
		let hexMatches = body.match(match1);
    if (hexMatches !== null && hexMatches.length > 0) {
    	this.badLines++;
    	return;
    }
 
		let ingested = Date.now();
    let event = {

		  start:	    tsa,
		  duration:   tsb,
		  body:       body,
		  number:			this.events.length,
		  ingested:		ingested,
    };

    this.events.push(event);
  }

  readLines(text)
  {
    let splits = text.split("\n");
    for(let i = 0; i < splits.length; i++) {
      let line = splits[i];
      this.parseLine(line);
    }

    //console.log(this.events);
  }

  overFlowCheck(time)
  {
    if(this.armed) {
      if (this.previousStamp > 0xA0000000 && time < 0x60000000) {
        this.baseTime += 0x100000000;
        this.armed = false;
      }
    } else { //unarmed
      if(time > 0x60000000) {
        this.lastBaseTime = this.baseTime;
        this.armed = true;
      }
    }
    this.previousStamp = time;
  }

  extendTime(time)
  {
    if (time > 0xA0000000)
      return time + this.lastBaseTime;
    else {
      return time + this.baseTime;
    }
  }

  extractInfo(evt) {
    let body = evt.body;
    let tag = "";
    let firstbit = "";
    let lastbit = "";
		let endEvent = false;
	
    let spl = body.split("|");
    if (spl.length > 1) {
      lastbit = spl[1];
    }

    if (spl.length > 0) {
      firstbit = spl[0];
    }

		let sent = body.split(splitspaceorcomma);

		let words = [];
		let numbs = [];

		for (let i = 0; i < sent.length; ++i) {
			let token = sent[i];
			if (isStrictlyNumeric(token)) {
				numbs.push(token);
			} else {
				words.push(token);
			}
		}
	
    if (words.length > 0) {
      tag = words[0];
    }


    if (tag.length === 0) {
      tag = body;
    }

    if (tag.length === 0) {
      tag = evt.body;
    }

    if (tag.length === 0) {
      tag = "_";
    }

		if (tag.indexOf('~') >= 0) {
			tag = tag.replace('~', '');
			endEvent = true;
		}
		// Extract last value from body for time series plotting
    // For now, go with the last number
    if (numbs.length > 0) {
      let str = numbs[numbs.length - 1];
      let num = Number(str);
      evt["value"] = num;
    }

    evt["tag"] = tag;
    evt["split"] = lastbit;
    evt["endEvent"] = endEvent;
 
    if(!this.trackSet.has(tag))
    {
      this.trackOrder.push(tag);
      let kind = evt.value != undefined ? 1 : 0;
      let tagInfo = new TagInfo(kind);
      this.tagInfoTable.set(tag, tagInfo);
      this.tagOrderOfAppearance.push(tagInfo);
 
      this.tagsToTrackNumber.set(tag, this.trackOrder.length);
      this.trackSet.add(tag);
    }
  }


 searchForPreviousEvent(events, index, tag)
{
	for (let i = index - 1; i >= 0; --i) {
		if (events[i].tag === tag) return i;
	}
		return -1;
}

  reflowTime() {
    // The following assumes that point events advance monotonically
    // while duration events are added to the timeline at their startTime+duration (AKA ending time)
    if (this.events.length == 0) return;
    this.minAbsTime = Number.MAX_VALUE;
    this.maxAbsTime = Number.MIN_VALUE;

    this.tagInfoTable.forEach((v, k)=>v.reset());
    for (let i = 0; i < this.events.length; ++i) {

      let evt = this.events[i];
      let time = evt.start;
      this.overFlowCheck(time);
      let absStart = this.extendTime(time);
      evt["absStart"] = absStart;
      this.extractInfo(evt);
 
      let tag = evt.tag;
      let tagInfo = this.tagInfoTable.get(tag);
      tagInfo.eventCount++;

 			if (absStart < this.minAbsTime) this.minAbsTime = absStart;
 			if ((absStart + evt.duration) > this.maxAbsTime) this.maxAbsTime = absStart + evt.duration;
	
      if(evt.value !== undefined) {
        if (!this.minRange.has(evt.tag)) {
          this.minRange.set(evt.tag, evt.value);
          this.maxRange.set(evt.tag, evt.value);
        } else {
          if (this.minRange.get(evt.tag) > evt.value) {
          		this.minRange.set(evt.tag, evt.value);
          	}
          if (this.maxRange.get(evt.tag) < evt.value) { 
          		this.maxRange.set(evt.tag, evt.value);    
          }
        } // end has
        let val = evt.value;
				if (val > tagInfo.maxRange) tagInfo.maxRange = val;
			   else if (val < tagInfo.minRange) tagInfo.minRange = val;

			  
      } // end undefined value
			  let end = absStart + evt.duration;
      	if (end > tagInfo.maxTime) tagInfo.maxTime = end;
			  if (absStart < tagInfo.minTime) tagInfo.minTime = absStart;
    } // end loop
  }

  report()
  {
    for (let i = 0; i < this.events.length; ++i) {
      let evt = this.events[i];
      console.log(evt.absStart + " " + evt.start + " " + evt.duration + " L: "
                  + evt.body + " T: " + evt.tag + " S: " + evt.split + " C: " + evt.color + " V: " + evt.value);
    }
  }

  matchEndings(eventList) {
  	for (let i = eventList.length - 1; i >= 0; --i) {
  		let evt = eventList[i];
  		if (evt.endEvent) {
  			let lastEx = this.searchForPreviousEvent(eventList, i, evt.tag);
  			if (lastEx >= 0) {
  				let lastEvt = eventList[lastEx];
  				eventList[lastEx].duration = evt.absStart - lastEvt.absStart;
  			}
  		}
  	}
  }
  
  
  assignRows() {
    this.trackMap.clear();
    let y = 0;
    for (let i = 0; i < this.trackOrder.length; ++i)
    {
      let tag = this.trackOrder[i];
      this.trackMap.set(tag, y);
      y += this.minRange.has(tag) ? this.plotHeight +  (this.laneHeight / 2) : this.laneHeight;
    }
    
    this.maxY = y;
  }
}

function openLocal(evt) {
  var files = evt.target.files;
  var f = files[0];
  if (f === undefined) return;
  $('#instructions').empty();

  var reader = new FileReader();
// Closure to capture the file information.
  reader.onload = (function(theFile) {
    return function(e) {
      // Display contents of file
      let t = e.target.result;
      setEventData(theFile, t);
    };
  })(f);

  // actually read in the tex file.
  reader.readAsText(f);
}

function setEventData(fileName, text) {
  $("#plot").empty();
  let es = new EventScanner();
  activeView = es;
  activeView.baseTime = 0;
  activeView.lastBaseTime = 0;
  es.readLines(text);
  es.reflowTime();
  es.assignRows();
  //es.report();
  let up = new uPlotter(es);
  up.plotEverything();

//	let jp = new jPlot(activeView);
//  jp.render();
}


function clearActiveView(event) {
  let es = new EventScanner();
  activeView = es;
  $("#debugOutput").empty();
}

function changeScale(event)
{
  let scaleString = new String(event.target.value);
  let ts = 400000000;
  if (scaleString == "microseconds") {
  	ts = 400;
  } else if (scaleString == "milliseconds") {
  	ts = 400000;
  }
	lastTimeScale = ts;
	if (activeView === undefined) return;
	activeView.timeScale = ts;
	activeView.render();
}

function changePlotHeight(event) {
	let asNum = Number(event.target.value);
	lastPlotHeight = asNum;
	if (activeView === undefined) return;
	activeView.plotHeight = asNum;
	//activeView.render();
	}

let callbackBuffer = "";

function renderBlock()
{
	if (!activeView) return;
	//if (!sysExRunning && !tippyActive) {
	//	activateTippy();
	//}

	if (callbackBuffer.length === 0) return;
	let lastNL = callbackBuffer.lastIndexOf("\n");
	if (lastNL >= 0) {
			let completes = callbackBuffer.substring(0, lastNL + 1);
			callbackBuffer =  callbackBuffer.substring(lastNL + 1, callbackBuffer.length);
	    $("#plot").empty();
	    activeView.baseTime = 0;
    	activeView.lastBaseTime = 0;
		  activeView.readLines(completes);
  		activeView.reflowTime();
  		activeView.assignRows();

/*
  		let tsData = activeView.uPlotter();
  		activeView.makeChart({mode: 1}, tsData);
*/
  	let up = new uPlotter(activeView);
  	up.plotEverything();

//	let jp = new jPlot(activeView);
//  jp.render();
	}
}

var theInterval;

// Regular render loop;
function setRefresh() {
  if (theInterval != null) {
    clearInterval(theInterval)
    theInterval = null;
  }

  theInterval = setInterval(function() { renderBlock(); }, 100);
}

function sysExCallback(text) {
	if (activeView == undefined) return;

	callbackBuffer = callbackBuffer.concat(text);
}

$("#clearbut").on('click', clearActiveView);
$("#opener").on('change', openLocal);
$("#scale").on('change', changeScale);
$("#plotH").on('change', changePlotHeight);

setSysExCallback(sysExCallback); setRefresh();
setEventData("test", ""); // no quotes. rttcapture or ""