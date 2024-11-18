import $ from 'jquery';
import {getDirInfo, readFile, writeToFile, recursiveDelete, downloadOneItem, recursiveDownload,
	guessMimeType, isTextFile, fdatetime2Date, date2fdatetime,
	getRidOfDoubleLeadingSlashes, filenamePartOnly, sendJsonRequest} from "midilib";

// Abstract superclass for file operations with FlashAir, local, or cloud-based.

class FileStore {
	
  constructor() {

  }

  dir(nextPath, done) {
  }

	exists(path, done) {
	}

	read(path, done) {
	}

	write(path, data, filetype, done) {
	}

	delete(path, done) {
	}

	mkdir(path, done) {
	}

	rename(path, path2, done) {
	}
}


function getActiveFS() {	

	return getDelugeFS();
}

var delugeSingleton;

function getDelugeFS() {	
	if (delugeSingleton === undefined) {
		delugeSingleton = new DelugeFileStore();
		window.delugeFS = delugeSingleton;
	}
	return delugeSingleton;
}



class DelugeFileStore extends FileStore {
	
  constructor() {
		super();
		this.currentDir = "";
		this.currentDirPath = "";
  }

  dir(nextPath, done) {
		getDirInfo(nextPath, (err, dirData)=>{
			if (err === 0) {
				let converted = [];
				for (let i = 0; i < dirData.length; ++i) {
					let f = dirData[i];
					converted.push({fname: f.name, fsize: f.size, attr: f.attr, date: fdatetime2Date(f.date, f.time), fdate: f.date, ftime: f.time, isDirectory: ((f.attr & 0x10) != 0)});
				}
				done(converted, err);
			} else done([], err);
		});
  }

	exists(path, done) {
		sendJsonRequest("info", params,(verb, object, data, payoff, zeroX)=>{
  	let params = object[verb];
  			done(params.err);
  	});
	}

	read(path, done) {
		readFile(path, done);
	}

	write(path, data, filetype, done) {
		writeToFile(path, data, done);
	}

	delete(path, done) {
		recursiveDelete(path, false).then((errd)=>{done(err)});
	}

	mkdir(path, done) {
			let dt = date2fdatetime(new Date());
	  	let params = {date: dt.fdate, time: dt.ftime, path: fullPath};
  		sendJsonRequest("mkdir", params,(verb, object, data, payoff, zeroX)=>{
  			let params = object[verb];
  			done(params.err);
  		});
	}

	rename(path, path2, done) {

  		sendJsonRequest("rename", {from: path, to: path2},(verb, object, data, payoff, zeroX)=>{
  			let params = object[verb];
  			done(params.err);
  			if (params.err !== 0) {
  				reject(params.err);
  			} else {
  					this.returnIndex(path, resolve, reject);
   			}
  		});
	}
}


export {DelugeFileStore, getDelugeFS, getActiveFS};