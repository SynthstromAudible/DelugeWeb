import $ from'jquery';
import Wave from './Wave.js';
/*
require('file-loader?name=[name].[ext]!../html/index.html');
require('file-loader?name=[name].[ext]!../css/edit.css');
require('file-loader?name=img/[name].[ext]!../img/copy-to-clipboard.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-170-record.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-171-step-backward.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-172-fast-backward.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-173-rewind.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-174-play.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-175-pause.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-176-stop.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-177-forward.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-178-fast-forward.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-179-step-forward.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-180-eject.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-182-download-alt.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-221-play-button.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-237-zoom-in.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-238-zoom-out.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-257-delete.png');
require('file-lleoader?name=img/[name].[ext]!../img/glyphicons-301-microphone.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-366-restart.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-419-disk-import.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-420-disk-export.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-433-plus.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-434-minus.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-435-redo.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-436-undo.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-447-floppy-save.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-448-floppy-open.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-511-duplicate.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-512-copy.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-513-paste.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-545-eye-plus.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-546-eye-minus.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-599-scissors-alt.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-728-resize-vertical.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-729-resize-horizontal.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-782-drop.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-94-crop.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-zoom-sel.png');
*/

import {filegroup_template, sfx_dropdn_template}  from "./templates.js";
import UndoStack from './UndoStack.js';
import {base64ArrayBuffer, base64ToArrayBuffer} from './base64data.js';
import {audioBufferToWav} from './audioBufferToWav.js';
import Dropdown from './Dropdown.js';
import {audioCtx, OfflineContext} from './AudioCtx.js';
import {FilterFrame} from './Filters.js';
import BiQuadFilter from './BiquadFilter.js';
import SimpleReverbFilter from './SimplereverbFilter.js';
import DelayFilter from './DelayFilter.js';
import OscFilter from './OscFilter.js';
import FileSaver from 'file-saver';
import {DelugeFileStore} from './FileStore.js';
import {openFileBrowser, saveFileBrowser} from './FileBrowser.js';
import {stepNextFile} from "./StepNextFile.js";


"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = false; //document.URL.indexOf('file:') == 0 || standAlone;
var sample_path_prefix = '/';

// Used to enable 'multiple samples open on one page'.
var multiDocs = false;

var gIdCounter = 0;
var localClipboard;

var focusWaveView;
var firstOpened = false;

var FS = new DelugeFileStore();
var homeDoc;

// Simplified to just multiply by 1/max(abs(buffer))
// (which preserves any existing DC offset).
function normalize(buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			let s = d[i];
			if (s < 0) s = -s;
			if (s > maxv) maxv = s;
		}
		if (maxv === 0) return;
		let scaler = 1.0 / maxv;
		for (var i = 0; i < d.length; ++i) {
			d[i] = d[i]* scaler;
		}
	}

	return buffer;
}

function reverse (buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;
	let halfbuf = bufLen / 2;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let d = buffer.getChannelData(cx);
		let td = bufLen - 1;
		for (var i = 0; i < halfbuf; ++i) {
			let s = d[i];
			d[i] = d[td];
			d[td--] = s;
		}
	}

	return buffer;
}

function applyFunction (buffer, f)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var minv = 1000000;
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			d[i] = f(d[i], i, bufLen);
		}
	}

	return buffer;
}


function openWaveFile(e) {
	let initial;
	if (focusWaveView) initial = focusWaveView.fname;
	if (!initial) initial = '/';
	openFileBrowser({
		initialPath:  initial,
		opener: function(name) {
			openFile(name);
		}

	});
}

function stepNextAsync(dir) {
	setTimeout(e=>{
		stepNextFile(focusWaveView.fname, dir, openFile);
	}, 0);
}


function registerGlobalHandlers() {
	console.log('register global handlers');
	$(window).on('paste', e=>{focusWaveView.pasteFromClip(e)});
	// iOS was screwing up if the following line was not commented out.
	$(window).on('copy', e=>{focusWaveView.copyToClip(e)});
	$(window).on('cut', e=>{focusWaveView.cutToClip(e)});

	$(window).on('undo', e=>{focusWaveView.doUndo(e)});
	$(window).on('redo', e=>{focusWaveView.doRedo(e)});

	$('.savebut').click(e=>{focusWaveView.saveAs(e)});
	$('.openbutn').click(e=>{openWaveFile(e)});

	$(document).keypress(function(e){
		focusWaveView.handleKeyPress(e);
	});

}



class WaveViewer {
  constructor(name) {

	this.idNumber = ""; // gIdCounter++;
	this.idString = "" + this.idNumber;
	this.homeId = this.idFor(name);
	this.html = filegroup_template({idsuffix: this.idNumber});
	this.undoStack = new UndoStack(10);
	

  }

  idFor(root) {
	return '#' + root + this.idString;
  }



 loadFile(filename, done) {

	this.loadInProgress = true;

	let me = this;
	
	FS.read(filename, (readPath, err, data)=>{
	 if (err === 0) {
	    let asBlob = new Blob([data]);
			me.setEditData(asBlob);
			if(done) done(asBlob);
		} else {
			console.log("Error: " + err);
		}
	 });
	}


 openFilter(e)
{
	if (this.filterFrame) {
		this.filterFrame.close();
	}

	this.filterFrame = new FilterFrame(this.idFor('procmods'), this.wave, this.undoStack);
	let targID = e.target.getAttribute('data-id');
	let classToMake;
	if (targID === 'openfilter') classToMake = BiQuadFilter;
	 else if (targID === 'openReverb') classToMake = SimpleReverbFilter;
	 else if (targID === 'openDelay') classToMake = DelayFilter;
	 else if (targID === 'openOsc') classToMake = OscFilter;
	this.filterFrame.open(classToMake);
}

 doPlaySel(e)
{
	let {start, end} = this.wave.getSelection(true);
	this.wave.surfer.play(start, end);
}


  deleteSelected(e)
{
	let buffer = this.wave.backend.buffer;
	let {insertionPoint, length, first, last, region} = this.wave.getSelection(false);
	if (insertionPoint) return;

	let ds = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = length - ds;
	if (bufLen === 0) bufLen = 1;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = 0; i < first; ++i) {
			da[dx++] = sa[i];
		}
		for(var i = last; i < length; ++i) {
			da[dx++] = sa[i];
		}
	}
	if(region) region.remove();
	this.undoStack.push(buffer);
	this.wave.changeBuffer(nextBuffer);
}

   cropToSel (e) {
	let buffer = this.wave.backend.buffer;
	let {insertionPoint, length, first, last, region} = this.wave.getSelection(false);
	if (insertionPoint) return;

	let bufLen = last - first;
	let {numberOfChannels, sampleRate} = buffer;

	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = first; i < last; ++i) {
			da[dx++] = sa[i];
		}
	}
	if(region) region.remove();
	this.wave.surfer.seekTo(0);
	this.undoStack.push(buffer);
	this.wave.changeBuffer(nextBuffer);
  }

// Adjust the selection so that it trims to zero crossings
 trimtozero() {
	let buffer = this.wave.backend.buffer;
	let {sampleRate} = buffer;
	let {insertionPoint, length, first, last, region} = this.wave.getSelection(false);
	if (insertionPoint) return;

	let sa = buffer.getChannelData(0);

	while (sa[first] === 0.0 && first < last) first++;
	last--;
	while (sa[last] === 0.0 && first < last) last--;
	let lsgn = Math.sign(sa[first]);
	if(last < first) return;
	let newL = first;
	for (var i = first + 1; i <= last; ++i) {
		if(Math.sign(sa[i]) != lsgn) {
			newL = i;
			break;
		}
	}

	let newR = last;
	let rsgn = Math.sign(sa[newR]);
	for (var i = last - 1; i >= first; i--) {
		if(Math.sign(sa[i]) != rsgn) {
			newR = i + 1;
			break;
		}
	}
	this.wave.setSelection(newL / sampleRate, newR / sampleRate);
}

// Apply a transform function to the selected area and replace the selected area
// with the result. The transform function can be either 'in place' or can return a
// result buffer of any size.
 applyTransform(f, f2)
{
	let working = this.wave.copySelected();
	let result = f(working, f2);

	this.undoStack.push(this.wave.pasteSelected(result));
}

  reverser(e) {
	this.applyTransform(reverse);
}

  normalizer(e) {
	
	this.applyTransform(normalize);
}

  fadeIn(e) {
	
	let f = function (s, i, len) {
		return s * (i / len);
	}
	this.applyTransform(applyFunction, f);
}

  fadeOut(e) {
	
	let f = function (s, i, len) {
		return s * (1.0 - i / len);
	}
	this.applyTransform(applyFunction, f);
}

  selAll(e) {
	let {insertionPoint, start, end, duration} = this.wave.getSelection(false);
	this.wave.surfer.regions.clear();
	this.wave.surfer.seekTo(0);
	// If wa are alread a full selection, quit right after we cleared.
	if (!insertionPoint && start === 0 && end === duration) return;

	let pos = {
		start:	0,
		end:	this.wave.surfer.getDuration(),
		drag:	false,
		resize: false,
	};
	this.wave.surfer.regions.add(pos);
}

  doUndo(e) {
	console.log("Undo");

	if (this.undoStack.atTop()) {
		let buffer = this.wave.backend.buffer;
		this.undoStack.push(buffer);
	}
	let unbuf = this.undoStack.undo();
	this.wave.changeBuffer(unbuf);
}

  doRedo(e) {
	console.log("Redo");
	let redo = this.undoStack.redo();
	this.wave.changeBuffer(redo);
}

   copyToClip(e) 
{
	let clip = e.originalEvent.clipboardData;

	let clipBuff = this.wave.copySelected();
	let wavData = audioBufferToWav(clipBuff);
	let asText = base64ArrayBuffer(wavData);
	localClipboard = clipBuff;
	if (clip) clip.setData('text/plain', asText);
	e.preventDefault();
}

   cutToClip(e) {
	this.copyToClip(e);
	this.deleteSelected(e);
}

  pasteFromClip(e)
 {
 	let me = this;
	let clipBd = e.originalEvent.clipboardData;
	if (clipBd) {
		let clip = clipBd.getData('text/plain');
		if (clip.startsWith('Ukl')) {
			let asbin = base64ToArrayBuffer(clip);
			me.wave.backend.decodeArrayBuffer(asbin, function (data) {
			if (data) me.undoStack.push(me.wave.pasteSelected(data, true));
	 	  }, function (err) {
			alert('paste decode error');
		  });
		  return;
		}
	}
	if (localClipboard) {
		this.undoStack.push(this.wave.pasteSelected(localClipboard, true));
	}
 }

  zoom(amt) {
	
	let minPxWas = this.wave.surfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	let zoomLimit = 192000;
	if (newPx > zoomLimit) newPx = zoomLimit;
// console.log('zoom rate: ' + newPx);
	this.wave.surfer.zoom(newPx);
}

  zoomsel() {
	let {start, end, duration} = this.wave.getSelection(false);
	let buffer = this.wave.backend.buffer;
	let {sampleRate} = buffer;
	let vw =  this.wave.surfer.drawer.getWidth();
	let dTs = end - start;
	let newPx;
	if (dTs > 0) {
		newPx = vw / dTs;
	} else {
		newPx = vw / duration * 0.9;
	}
//	this.wave.surfer.zoom(newPx);
//	this.wave.seekTo( (start - (dTs / 2)) / duration);
	
	this.wave.reframe(newPx, (start + end) / 2 / duration);
}


// At present, our keypress handling is crude. Most keypresses come thru here, even if the focus
// is in other places. We filter-out file browser keypresses, and avoid other problems
// by not using number keys as shortcuts, which stays out of the way of the filter dials.
  handleKeyPress(e)
{
	//if (true) return; // Mask keys intended for file browser. fileBrowserActive

	let ch = e.key;
	let chlow = ch.toLowerCase();

	if (ch === 'z') {
		this.doUndo(e);
	} else if (ch === 'Z') {
		this.doRedo(e);
	} else if (chlow === 'x') {
		this.cutToClip(e);
	} else if (chlow === 'c') {
		this.copyToClip(e);
	} else if (chlow === 'v') {
		this.pasteFromClip(e);
	} else if (chlow === 'b') {
		this.deleteSelected(e);
	} else if (chlow === 'a') {
		this.selAll(e);
	} else if (chlow === 'i') {
		this.zoomsel(e);
	} else if (ch === 'p') {
		this.wave.surfer.playPause(e);
	} else if (ch=== 'P') {
		this.doPlaySel(e);
	} else if (ch === '-' || ch === '_') {
		this.zoom(0.5);
	} else if (ch === '=' || ch === '+') {
		this.zoom(2.0);
	} else if (chlow === 't') {
		this.trimtozero();
	} else if (chlow === 'r') {
		this.wave.surfer.seekTo(0);
	} else if (chlow === 'k') {
		this.cropToSel(e);
	} /*else if (chlow === 'u') {
		stepNextAsync(-1);
	} else if (chlow === 'd') {
		stepNextAsync(1);
	} */
//	console.log("*** Key down: " + e.keyCode);
}


  bindGui() {
	let me = this;
	let id = this.idFor('butnrow');
	let baseEl = $(id);

	$('.playbut', baseEl).click(e=>{me.wave.surfer.playPause(e)});
	$('.rewbut', baseEl).click( e=>{me.wave.surfer.seekTo(0)});
	$('.playselbut', baseEl).click(e=>{me.doPlaySel(e)});
	$('.undobut', baseEl).click(e=>{me.doUndo(e)});
	$('.redobut', baseEl).click(e=>{me.doRedo(e)});
	$('.delbut', baseEl).click(e=>{me.deleteSelected(e)});
	$('.cutbut', baseEl).click(e=>{me.cutToClip(e)});
	$('.copybut', baseEl).click(e=>{me.copyToClip(e)});

	$('.pastebut', baseEl).click(e=>{me.pasteFromClip(e)});
	$('.normbut', baseEl).click(e=>{me.normalizer(e)});
	$('.reversebut', baseEl).click(e=>{me.reverser(e)});
	$('.fadeinbut', baseEl).click(e=>{me.fadeIn(e)});
	$('.fadeoutbut', baseEl).click(e=>{me.fadeOut(e)});
	$('.selallbut', baseEl).click(e=>{me.selAll(e)});
	$('.zoominbut', baseEl).click(e=>{me.zoom(2.0)});
	$('.zoomselbut', baseEl).click(e=>{me.zoomsel()});
	$('.zoomoutbut', baseEl).click(e=>{me.zoom(0.5)});
	$('.trimbut', baseEl).click(e=>{me.trimtozero(e)});
	$('.cropbut', baseEl).click(e=>{me.cropToSel(e)});

// disable the filter stuff until we get around to converting from ScriptProcessorNode to AudioWorkletNode
	//var sfxdd = sfx_dropdn_template();
	//new Dropdown(this.idFor('dropdn'), sfxdd, e=>{me.openFilter(e)});

	this.playBtnImg = $('.playbutimg', baseEl);
	this.undoBtn = $('.undobut', baseEl);
	this.redoBtn = $('.redobut', baseEl);
}

  setDisable(item, state)
{
	if (!item) return;
	if (item.prop)
	{
		item.prop("disabled", state);
	}
	item.css('opacity', state ? 0.3: 1.0);
}

  updateGui()
{
	if(!this.wave || !this.wave.surfer) return;
	let playState = this.wave.surfer.isPlaying();

	let newPlayImg = "img/glyphicons-174-play.png"

	if (this.playBtnImg) {
		if (playState) newPlayImg = "img/glyphicons-175-pause.png";
		if (this.playBtnImg.attr('src') !== newPlayImg) {
			this.playBtnImg.attr('src',newPlayImg);
		}
	}

	let canUndo = this.undoStack.canUndo();
	this.setDisable(this.undoBtn, !canUndo);

	let canRedo = this.undoStack.canRedo();
	this.setDisable(this.redoBtn, !canRedo);
}

  startGuiCheck() {
	let me = this;
 	this.checker = e=>{me.updateGui()};
	if(!this.guiCheck) this.guiCheck = setInterval(this.checker, 200);
}

/*
// Chrome decided to only allow the browser access to the microphone when the page has been served-up via https
// since the FlashAir card doesn't do that, we can't record audio. Another annoying browser incapacity.
function record()
{
	var mike = new Microphone({}, this.wave.surfer);

	mike.start();
}
*/

// data = DOMException: Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).


//editor
  setEditData(data)
{
	if(!this.wave) {
		let test = this.idFor('waveform');
		this.wave = new Wave(this.idFor('waveform'), {splitChannels: true});
	}
	this.wave.openOnBuffer(data);
	this.startGuiCheck();
	// let loadEndTime = performance.now();
	// console.log("Load time: " + (loadEndTime - loadStartTime));
}


//---------Button-----------

  uploader(evt)
 {
  let file = this.fname;
  if (file !== "") {
  	let fileA = file.split('/');
  	file = fileA[fileA.length - 1];
  }
  if (file === "") file = "Untitled Sample.WAV";
	let saveName = window.prompt("Save sample back to device under the name:", file);

  if (saveName !== null && saveName !== undefined && saveName !== "")
  {
		let aBuf = this.wave.backend.buffer;
		let saveData = audioBufferToWav(aBuf);
		FS.write(saveName, saveData, "audio/wav", function () {}) ;
	}
 }



  openLocal(evt)
 {
 	let me = this;

	if (firstOpened && multiDocs) {
		 that = new WaveViewer('wavegroup');
		 $('#wavegroups').append(me.html);
		 me.bindGui();
		 focusWaveView = that;
	}
	firstOpened = true;
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	this.fname = f.name;
	var reader = new FileReader();
	if(!me.wave) {
		me.wave = new Wave(me.idFor('waveform'), {splitChannels: true});
	}
	if (local_exec) {
		$('#instructions').empty();
	}
// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		me.wave.openOnBuffer(theFile);
		me.startGuiCheck();
	})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
 }

 genWAV() {
 	let aBuf = this.wave.backend.buffer;
	let saveData = audioBufferToWav(aBuf);
	return saveData;
 }


  saveAs(){
	let me = this;
	saveFileBrowser({
		initialPath:  this.fname,
		saver: function(name) {
			let aBuf = me.wave.backend.buffer;
			let saveData = audioBufferToWav(aBuf);
			// console.log("Save to: " + name);
			me.saveFile(name, saveData);
		}
	});
}


saveFile(filepath, data)
{
	let me = this;
	let saveData = new Uint8Array(data); 
	FS.write(filepath, saveData, "audio/wav", function () {}) ;
}

}; // ** End of class



//.value

function downloader(evt) {
	if(!focusWaveView) return;
	let saveWAV = focusWaveView.genWAV();
	var blob = new Blob([saveWAV], {type: "audio/wav"});
	let saveName = focusWaveView.fname.name 

	console.log(saveName);
	FileSaver.saveAs(blob, saveName);
}


//---------- When reading page -------------
function onLoad()
{
	homeDoc = new WaveViewer('wavegroup');
	$('#wavegroups').append(homeDoc.html);

	if(!focusWaveView) {
		focusWaveView = homeDoc;
		registerGlobalHandlers();
	}


		let params = (new URL(document.location)).searchParams;
		let urlarg = params.get("file");
		if (urlarg !== null) {
			homeDoc.fname = decodeURIComponent(urlarg);

			FS.read(homeDoc.fname , "blob", function (data, status) {
			if (status === 'OK') {
				homeDoc.setEditData(data);
			}
		});
  }
	$('#opener').on('change', (e)=>{homeDoc.openLocal(e)});
	$('#uploader').click((e)=>{homeDoc.uploader(e)});
	$('#downloadbut').click((e)=>{downloader(e)});
	homeDoc.bindGui();
}


function openFile(fname)
{
	let homeDoc = new WaveViewer('wavegroup');
	homeDoc.loadFile(fname);
	if(!multiDocs) $('#wavegroups').empty();
	$('#wavegroups').append(homeDoc.html);
	homeDoc.bindGui();

	focusWaveView = homeDoc;
}




window.onload = onLoad;
