"use strict";

import $ from'jquery';
import tippy from "./js/tippy.all.min.js";
import {setSysExCallback, sysExRunning} from "./mididriver.js";

var activeView;
// We must also update the 'selected' attribute in the dropdown element in the html file.
var lastTicksPerPixel = 5000000;

var lastPlotHeight = 100;

// Test data:
let rttcapture =
  `00> 635F6CD1,00010000 openFP#F0F
 00> 64E76C1E uS per 320 samples: 15
00> 6505ABCA uS per 320 samples: 11
00> 65CC5990 uS per 320 samples: 49
00> 665F31E9 uS per 320 samples: 159

00> 667D2424 A
00> 697DF000 ~A
00> Trash
00> 697E2AD5 loading song!!!!!!!!!!!!!!
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


// Draws a line without using a canvas. Uses a long thin <div> that is rotated.
// from Craig Tab via https://stackoverflow.com/questions/14560302/html-line-drawing-without-canvas-just-js
// improved by Davide.
function linedraw(x1, y1, x2, y2) {
  if (x2 < x1) {
    var tmp;
    tmp = x2 ;
    x2 = x1 ;
    x1 = tmp;
    tmp = y2 ;
    y2 = y1 ;
    y1 = tmp;
  }

  var lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  var m = (y2 - y1) / (x2 - x1);

  var degree = Math.atan(m) * 180 / Math.PI;

  //let str = "<div class='line' style=\"transform-origin: top left; transform: rotate(' + degree + 'deg); width: ' + lineLength + 'px; height: 1px; background: black; position: absolute; top: ' + y1 + 'px; left: ' + x1 + 'px;\"></div>";
  let str = "<div class='line' style='transform-origin: top left; transform: rotate(" + degree + "deg); width: " + lineLength + "px; height: 1px; background: black; position: absolute; top: " + y1 + "px; left: " + x1 + "px;'></div>";
  //console.log(str); 
  return $(str);
}

function searchForPreviousEvent(index, tag)
{
	for (let i = index - 1; i >= 0; --i) {
		if( activeView.events[i].tag === tag) return i;
	}
		return -1;
}

var tippyActive = false;

function activateTippy() {
		tippy('.evt', {
		arrow: true,
		html: '#tippytemp',
		onShow(pop) {
			if (!activeView) return;
			const content = this.querySelector('.tippy-content');
			let eventId = pop.reference.getAttribute('data-eid');
			if (eventId >= activeView.events.length) return;
			let evt = activeView.events[eventId];
			let evtStr = evt.tag + " ";
			if (evt.value) {
				evtStr = evt.value + " ";
			}
			evtStr += "t=" + (evt.absStart - activeView.firstTime) / 400000000;
			let duration = 0;
			if (evt.duration > 0.0){
				duration = evt.duration;
			} else if (evt.endEvent) {
				let px = searchForPreviousEvent(eventId, evt.tag);
				duration = evt.absStart - activeView.events[px].absStart;
			}
			let dur = duration / 400000000;
			if (dur > 0.0) evtStr += ", \u0394t=" + dur;
			evtStr += "<br>" + evt.body;
			content.innerHTML = evtStr;
		},
	});
}


class EventScanner
{
  constructor() {

    this.events = [] ;
    this.firstTime = true;
    this.baseTime = 0;
    this.lastBaseTime = 0;
    this.armed = false;
    this.previousStamp = 0;
    this.trackSet = new Set();
    this.trackOrder = [];
    this.trackMap = new Map();
    this.maxRange = new Map();
    this.minRange = new Map();
    this.minAbsTime = Number.MAX_VALUE;
    this.maxAbsTime = Number.MIN_VALUE;
    this.flipped = true;
    this.maxY = 0;
    this.plotHeight = lastPlotHeight;
    this.laneHeight = 16;
    this.ticksPerPixel = lastTicksPerPixel;

  }

  parseLine(inbuffer)
  {
    let maxLen = inbuffer.length;
    let cursor = 0;
    if (cursor + 3 > maxLen) return;
    // If we are dealing with RTT data, skip the terminal indicator part.
    if (inbuffer[cursor + 2 ] === '>') {
      cursor += 4;
    }

    if(cursor + 8 > maxLen) return;
// 	let runx = parseInt(ps.substring(cursor + 8, cursor + 16), 16);
    let tsa = parseHex(inbuffer.substring(cursor, cursor + 8));
    if (isNaN(tsa)) return;
    let tsb = 0;
    cursor += 8;
    if (cursor + 1 > maxLen) return;
    if (cursor + 8 <= maxLen && inbuffer[cursor] === ",") {
      tsb = parseHex(inbuffer.substring(cursor + 1, cursor + 9));
      if (isNaN(tsb)) return;
      cursor += 10;
    } else cursor++;
    let body = "";
    if (cursor < maxLen) {
      body = inbuffer.substring(cursor, inbuffer.length).trim();
    }

    let event = {
		  start:	    tsa,
		  duration:   tsb,
		  body:      body,
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

  reflowTime() {
    // The following assumes that point events advance monotonically
    // while duration events are added to the timeline at their startTime+duration;
    if (this.events.length == 0) return;
    this.minAbsTime = Number.MAX_VALUE;
    this.maxAbsTime = Number.MIN_VALUE;
    for (let i = 0; i < this.events.length; ++i) {
      let evt = this.events[i];
      let time = evt.start;
      this.overFlowCheck(time);
      let absStart = this.extendTime(time); 
      evt["absStart"] = absStart;
      this.extractInfo(evt);
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
      } // end undefined
    } // end loop
  }

  extractInfo(evt) {
    let body = evt.body;
    let tag = "";
    let color = "#000";
    let firstbit = "";
    let lastbit = "";
		let endEvent = false;
	
    // handle and remove colors from bodys. If more than one, use the last one.
    while (body.search("#") >= 0) {
      let cx = body.search("#");
      color = "#" + body.substring(cx + 1, cx + 4);
      body = body.substring(0, cx) + body.substring(cx + 4);
    }

    let spl = body.split("|");
    if (spl.length > 1) {
      lastbit = spl[1];
    }

    if (spl.length > 0) {
      firstbit = spl[0];
    }

		let sent = body.split(" ");

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

    if (color != undefined && color.length > 0)
    {
      evt["color"] = color;
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
    evt["decolored"] = body;
    evt["split"] = lastbit;
    evt["color"] = color;
    evt["endEvent"] = endEvent;
 
    if(!this.trackSet.has(tag))
    {
      this.trackOrder.push(tag);
      this.trackSet.add(tag);
    }
  }

  report()
  {
    for (let i = 0; i < this.events.length; ++i) {
      let evt = this.events[i];
      console.log(evt.absStart + " " + evt.start + " " + evt.duration + " L: "
                  + evt.body + " T: " + evt.tag + " S: " + evt.split + " C: " + evt.color + " V: " + evt.value);
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

  render() {
  	let performance = window.performance;
  	let rstart = performance.now();
    let firsttime = this.minAbsTime;
    let lastX = (this.maxAbsTime - this.minAbsTime) / this.ticksPerPixel;
    let timeline = $("<div/>");
    let lastXMap = new Map();
    let lastYMap = new Map();
    let lastEventForTag = new Map();
    timeline.addClass('timeline');
    let maxWidth = ((this.maxAbsTime - this.minAbsTime) / this.ticksPerPixel);
		timeline.css("width", maxWidth + "px");
		timeline.css("height", (this.maxY + this.laneHeight) + "px");
    for (let i = 0; i < this.events.length; ++i) {
      let evt = this.events[i];
      let relT = evt.absStart - firsttime;
      let tag = evt.tag;
      let item = $('<div/>');
      let y = this.trackMap.get(evt.tag);
      if (evt.value != undefined)
      {
        let minV = this.minRange.get(tag);
        let maxV = this.maxRange.get(tag);
        let range = (maxV - minV);
        if (range === 0) range = 1;
        y += this.plotHeight - (((evt.value - minV) * this.plotHeight) / range);
        let x = relT / this.ticksPerPixel;
        if (this.flipped) {
        	x = lastX - x;
        }
        if (lastXMap.has(tag)) {
           item = linedraw(lastXMap.get(tag), lastYMap.get(tag), x, y);
        }
        item.addClass('valueplot');
        lastXMap.set(tag, x);
        lastYMap.set(tag, y);
      } else {
        item.addClass('eventItem');
        let t1 = evt.absStart - firsttime;
        let t2;
        if (evt.duration > 0) {
   				t1 = evt.absStart - firsttime;
   				t2 = t1 + evt.duration;
        } else if (evt.endEvent) {
        // This is an "ending event", so draw the bar from the previous event to here.
        	let prevX = searchForPreviousEvent(i, evt.tag);
        	if (prevX < 0) continue;
          t2 = this.events[prevX].absStart - firsttime;
        } else {
        	t2 = t1;
        }

				let width = 2;
				if (t1 != t2) {
        	width = Math.abs(t2 - t1) / this.ticksPerPixel;
  			}
        if (width < 1) width = 1;
   
        let x = t1 /  this.ticksPerPixel;
        if (this.flipped) {
        	x = (lastX - x);
        } else {
        	x -= width;
        }
        item.css("width", width + "px");
        item.css("left", x + "px");
        item.css("top", y + "px");
      }

      item.css("background-color", evt.color);
      item.attr('data-eid', i);
      item.addClass('evt');
      timeline.append(item);
      lastEventForTag.set(tag, evt);
    }

    this.addTagLabelsTo(timeline);
    $("#plot").empty();
    $("#plot").append(timeline);
    /*
    let plot = $("#plot");
    plot.css("width", maxWidth + "px");
		plot.css("height", (this.maxY + this.laneHeight) + "px");css("width", );
		*/
		if (!sysExRunning) activateTippy();
			else tippyActive = false;
    let rend = performance.now();
    console.log("Time to render: " + (rend - rstart));
  }

  addTagLabelsTo(timeline) {

	  let keyDiv = $("<div class='overlay' style='top: 0px;left:0px'></div");
	  for (let i = 0; i < this.trackOrder.length; ++i) {
	  	let tag = this.trackOrder[i];
	  	let y = this.trackMap.get(tag);
	  	let labline = $("<div class='linelabel'/>");
	  	labline.css("top", y + "px");
	  	labline.text(tag);
	  	keyDiv.append(labline);
	  }
		timeline.append(keyDiv);
  }
};

function openLocal(evt)
{
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
  es.readLines(text);
  es.reflowTime();
  es.assignRows();
  //es.report();
  es.render();
}


function clearActiveView(event) {
  let es = new EventScanner();
  activeView = es;
  $("#debugOutput").empty();
}

function changeScale(event)
{
  let scaleString = new String(event.target.value);
	let nocommas = scaleString.replaceAll(',','');
	let asNum = Number(nocommas);
	lastTicksPerPixel = asNum;
	if (activeView === undefined) return;
	activeView.ticksPerPixel = asNum;
	//console.log(activeView.ticksPNerPixel);
	activeView.render();
}

function changePlotHeight(event) {
	let asNum = Number(event.target.value);
	lastPlotHeight = asNum;
	if (activeView === undefined) return;
	activeView.plotHeight = asNum;
	activeView.render();
	}

let callbackBuffer = "";

function renderBlock()
{
	if (!activeView) return;
	if (!sysExRunning && !tippyActive) {
		activateTippy();
	}

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
  		activeView.render();
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

setSysExCallback(sysExCallback);
setRefresh();
setEventData("test", ""); // rttcapture



