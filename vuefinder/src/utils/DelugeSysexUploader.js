import {Uppy, BasePlugin} from '@uppy/core';
import {writeToFile} from "midilib";

// Based on skeleton from uppu.io

class DelugeSysexUploader extends BasePlugin {
    constructor(uppy, opts) {
        super(uppy, opts);
        this.id = opts.id || 'DelugeSysexUploader';
        this.type = 'uploader';
        this.app = opts.app;
        this.optz = opts;
        this.prepareUpload = this.prepareUpload.bind(this);
        this.doUpload = this.doUpload.bind(this);
    }

    prepareUpload(fileIDs) {
        console.log(this);
        return Promise.resolve();
    }

		doUpload(fileList) {
			  console.log(this);
			  let workingFileList = fileList;
	  		let { promise, resolve, reject } = Promise.withResolvers();
	  		let ourUppy = this.uppy;
	  		let ourApp = this.app;
	  		let lastProgress = -1;
	  		function uploadNext() {
	  			let fid = workingFileList.shift();
	  			if (fid === undefined) {
	  				resolve();
	  			} else {
	  				// upload fid.
	  				let uf = ourUppy.getFile(fid);
						console.log("uploading: " + uf);
						const reader = new FileReader();
						reader.onload = (event) => {
							let aBuf = event.target.result;
							let asu8 = new Uint8Array(aBuf);
							let dirPart = ourApp.fs.data.dirname;
							let destPath = dirPart + "/" + uf.name;
							let abortFunction = writeToFile(destPath, asu8, (err) => {
        				if (err === 0) {
        					let dummyResp = {uploadURL: destPath};
        					ourUppy.emit('upload-success', uf, dummyResp);
        					console.log("Done: " + destPath);
        					uploadNext();
        				} else {
        					reject(err);
        				}
    					}, (sofar, total)=> {
    						  let nowPer = Math.round((sofar/total) * 100);
    						  if (nowPer > lastProgress) {
    						  	  console.log("Progress: " + nowPer);
    						  	  lastProgress = nowPer;
    						  }
    					});
						};

						// Handle errors  
						reader.onerror = (error) => {  
							reject(error);  
						};
						reader.readAsArrayBuffer(uf.data);
	  			}
	  		}
				uploadNext();

	  		return promise;
		}

    install() {
    	  this.uppy.addPreProcessor(this.prepareUpload);  
        this.uppy.addUploader(this.doUpload);
    }

    uninstall() {
    	this.uppy.removePreProcessor(this.prepareUpload);
        this.uppy.removeUploader(this.doUpload);
    }
}


export {DelugeSysexUploader};