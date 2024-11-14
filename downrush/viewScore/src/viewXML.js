import $ from'jquery';

import {openFileBrowser, saveFileBrowser} from './FileBrowser.js';

import React from 'react';
import ReactDOM from "react-dom";
import FileSaver from 'file-saver';

import {stepNextFile} from "./StepNextFile.js";
import {setFocusDoc, makeDelugeDoc} from "./SongViewLib.js";
import {setSamplePathPrefix} from "./samplePath.js";
import {empty_kit_temp} from './templates.js';


import {getDirInfo, readFile, writeToFile} from "midilib";
	
"use strict";

// Change the following line as needed to point to the parent directory containing your sample directory.
// If you leave it undefined, our code will make an informed guess as to where your samples are located.
// You probably don't need to change it.
var custom_sample_path = undefined;

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0 || standAlone;

var focusDoc;

/*******************************************************************************

		 File and GUI

 *******************************************************************************
*/

function setupGUI()
{
	$('.savebut').click(e=>{saveAs(e)});
	
	$('.openbutn').click(e=>{
		let initial; // fname
		if (!initial) initial = '/';
		openFileBrowser({
			initialPath:  initial,
			opener: function(nameList) {
				let name = nameList;
				loadFile(name);
//				fname = name;
			}
		});
	});
	
	$('.upbut').click(e=>{
		stepNextFile(focusDoc.fname, -1, loadFile);
	});
	
	$('.downbut').click(e=>{
		stepNextFile(focusDoc.fname, 1, loadFile);
	});
	$('.nkitbut').click(e=>{newKitDoc()});
}

function openLocal(evt)
{
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	if (local_exec) {
		$('#instructions').empty();
	}
	var reader = new FileReader();
// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			// Display contents of file
				let t = e.target.result;
				setEditText(theFile, t);
			};
		})(f);

	// Read in the image file as a data URL.
	reader.readAsText(f);
}

function downloader(evt) {
	if(!focusDoc) return;
	let saveXML = focusDoc.genDocXMLString();
	var blob = new Blob([saveXML], {type: "text/xml;charset=utf-8"});
	let saveName;
	if (local_exec) {
		saveName = focusDoc.fname.name 
	} else {
		saveName = focusDoc.fname.split('/').pop();
	}
	if (!saveName) saveName ='SONG.XML';
	console.log(saveName);
	FileSaver.saveAs(blob, saveName);
}

//---------- When reading page -------------
function onLoad()
{
	// Getting arguments
	var urlarg = location.search.substring(1);
	var fname;
	if(urlarg != "")
	{
		// Decode and assign to file name box
		fname = decodeURI(urlarg);
	}

	if(!local_exec) {
		loadFile(fname);
	} else {
		$('#opener').on('change', openLocal);
		if (custom_sample_path) {
			setSamplePathPrefix(custom_sample_path);
		} else {
			if (document.URL.indexOf('DR/xmlView')> 0) {
				setSamplePathPrefix('../../');
			} else if (document.URL.indexOf('xmlView')> 0) {
				setSamplePathPrefix ('../');
			} else setSamplePathPrefix('');
		}
	}
	$('#downloadbut').click((e)=>{downloader(e)});
	setupGUI();
}
window.onload = onLoad;

  function saveAs(){
  	if (!focusDoc) return;
	saveFileBrowser({
		initialPath: focusDoc.fname,
		saver: function(name) {
			focusDoc.save(name);
		}
	});
}

function newKitDoc(e) {
	let filledKitT = empty_kit_temp;
	focusDoc = makeDelugeDoc("/KITS/KIT0.XML", filledKitT, {newKit: true});
	setFocusDoc(focusDoc);
  }


//editor
function setEditText(fname, text)
{
	focusDoc = makeDelugeDoc(fname, text, {});
	setFocusDoc(focusDoc);
}

// use ajax to load xml data (instead of a web worker).
  function loadFile(fname)
{
	$("#statind").text("Loading: " +  fname);
	
	readFile(fname, (path, status, data)=>{
		  if (status === 0) {
		  	let str = new TextDecoder().decode(data);
				setEditText(fname, str);
		} else {
				console.log("Error: " + status);
		}
	});
	
}

