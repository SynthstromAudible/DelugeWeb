"use strict";

import $ from'jquery';
import {setSysExCallback, sysExRunning, clearLog} from "./mididriver.js";
import uPlot from "./js/uPlot.esm.js";
import {uPlotter} from "./uPlotter.js";
import {jPlot} from "./jPlot.js";
import {EventScanner} from "./EventScanner.js";

//import { createApp } from 'vue';
//import App from './App.vue';

let ViewParams = {
	timeScale: 400000000,
	plotHeight: 100,
};

var activeScanner;
// We must also update the 'selected' attribute in the dropdown element in the html file.

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
  //$("#plot").empty();
  let es = new EventScanner();
  activeScanner = es;
  activeScanner.baseTime = 0;
  activeScanner.lastBaseTime = 0;
  es.readLines(text);
  es.reflowTime();
  //es.report();
  let up = new uPlotter(es);
  up.plotEverything();

//	let jp = new jPlot(activeView);
//  jp.render();
}


function clearActiveScanner(event) {
  let es = new EventScanner();
  activeScanner = es;
  clearLog();
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
	ViewParams.timeScale = ts;
	if (activeScanner === undefined) return;
	//activeScanner.render();
}

function changePlotHeight(event) {
	let asNum = Number(event.target.value);
	ViewParams.plotHeight = asNum;
	if (activeScanner === undefined) return;
	}

let callbackBuffer = "";

function renderBlock()
{
	if (!activeScanner) return;

	if (callbackBuffer.length === 0) return;
	let lastNL = callbackBuffer.lastIndexOf("\n");
	if (lastNL >= 0) {
			let completes = callbackBuffer.substring(0, lastNL + 1);
			callbackBuffer =  callbackBuffer.substring(lastNL + 1, callbackBuffer.length);
	    $("#plot").empty();
	    activeScanner.baseTime = 0;
    	activeScanner.lastBaseTime = 0;
		  activeScanner.readLines(completes);
  		activeScanner.reflowTime();
/*
  		let tsData = activeView.uPlotter();
  		activeScanner.makeChart({mode: 1}, tsData);
*/
  	let up = new uPlotter(activeScanner);
  	up.plotEverything();
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
	if (activeScanner == undefined) return;

	callbackBuffer = callbackBuffer.concat(text);
}

function startup () {
	
	/*
$("#clearbut").on('click', clearActiveScanner);
$("#opener").on('change', openLocal);
$("#scale").on('change', changeScale);
$("#plotH").on('change', changePlotHeight);
*/
setSysExCallback(sysExCallback); setRefresh();
setEventData("test", ""); // no quotes arounf rttcapture, simplecap, or ""

}

export {ViewParams, openLocal, startup, clearActiveScanner, changeScale, changePlotHeight};
