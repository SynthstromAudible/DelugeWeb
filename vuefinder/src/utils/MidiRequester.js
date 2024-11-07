import {getDirInfo, readFile, writeToFile, recursiveDelete, downloadOneItem, recursiveDownload,
	guessMimeType, isTextFile, fdatetime2Date, date2fdatetime,
	getRidOfDoubleLeadingSlashes, filenamePartOnly, sendJsonRequest} from "midilib";

import { saveAs } from 'file-saver';

export const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

/**
 * @typedef RequestConfig
 * @property {String} baseUrl
 * @property {Record<String,String>=} headers Additional headers
 * @property {Record<String,?String>=} params Additional query params
 * @property {Record<String,*>=} body Additional body key pairs
 * @property {RequestTransformer=} transformRequest Transform request callback
 * @property {String=} xsrfHeaderName The http header that carries the xsrf token value
 */
/**
 * @typedef RequestTransformParams
 * @property {String} url
 * @property {'get'|'post'|'put'|'patch'|'delete'} method
 * @property {Record<String,String>} headers
 * @property {Record<String,?String>} params
 * @property {Record<String,?String>|FormData|null} body
 */
/**
 * @typedef RequestTransformResult
 * @property {String=} url
 * @property {'get'|'post'|'put'|'patch'|'delete'=} method
 * @property {Record<String, String>=} headers
 * @property {Record<String, ?String>=} params
 * @property {Record<String,?String>|FormData=} body
 */
/**
 * @typedef RequestTransformResultInternal
 * @property {String} url
 * @property {'get'|'post'|'put'|'patch'|'delete'} method
 * @property {Record<String, String>} headers
 * @property {Record<String, ?String>} params
 * @property {Record<String,?String>|FormData=} body
 */
/**
 * @callback RequestTransformer
 * @param {RequestTransformParams} request
 * @returns {RequestTransformResult}
 */
 
 

/**
 * Base http requester
 */
class Requester {
    /** @type {RequestConfig} */
    config

    /** @param {RequestConfig} config */
    constructor(config) {
        this.config = config;
    }

    /** @type {RequestConfig} */
    get config() {
        return this.config;
    }

    /**
     * Transform request params
     * @param {Object} input
     * @param {String} input.url
     * @param {'get'|'post'|'put'|'patch'|'delete'} input.method
     * @param {Record<String,String>=} input.headers
     * @param {Record<String,?String>=} input.params
     * @param {Record<String,?String>|FormData=} input.body
     * @return {RequestTransformResultInternal}
     */
    transformRequestParams(input ) {
        const config = this.config;
        const ourHeaders = {};
        if (csrf != null && csrf !== '') {
            ourHeaders[config.xsrfHeaderName] = csrf;
        }
        /** @type {Record<String, String>} */
        const headers = Object.assign({}, config.headers, ourHeaders, input.headers);
        const params = Object.assign({}, config.params, input.params);
        const body = input.body;
        const url = config.baseUrl + input.url;
        const method = input.method;
        let newBody
        if (method !== 'get') {
            /** @type {Record<String,*>|FormData} */
            if (!(body instanceof FormData)) {
                // JSON
                newBody = { ...body };
                if (config.body != null) {
                    Object.assign(newBody, this.config.body);
                }
            } else {
                // FormData
                newBody = body;
                if (config.body != null) {
                    Object.entries(this.config.body).forEach(([key, value]) => {
                        newBody.append(key, value);
                    });
                }
            }
        }
        /** @type {RequestTransformResultInternal} */
        const transformed = {
            url,
            method,
            headers,
            params,
            body: newBody,
        }
        if (config.transformRequest != null) {
            const transformResult = config.transformRequest({
                url,
                method,
                headers,
                params,
                body: newBody,
            });
            if (transformResult.url != null) {
                transformed.url = transformResult.url;
            }
            if (transformResult.method != null) {
                transformed.method = transformResult.method;
            }
            if (transformResult.params != null) {
                transformed.params = transformResult.params ?? {};
            }
            if (transformResult.headers != null) {
                transformed.headers = transformResult.headers ?? {};
            }
            if (transformResult.body != null) {
                transformed.body = transformResult.body;
            }
        }
        return transformed
    }


    /**
     * Get download url
     * @param {String} adapter
     * @param {String} node
     * @param {String} node.path
     * @param {String=} node.url
     * @return {String}
     */

    // Mangled by JFF to return a single slash pathname only.
    getDownloadUrl(adapter, node) {
    		return getRidOfDoubleLeadingSlashes(node.path);
    }

    /**
     * Get preview url
     * @param {String} adapter
     * @param {String} node
     * @param {String} node.path
     * @param {String=} node.url
     * @return {String}
     */
    getPreviewUrl(adapter, node) {
        if (node.url != null) {
            return node.url
        }
        const transform = this.transformRequestParams({
            url: '',
            method: 'get',
            params: { q: 'preview', adapter, path: node.path }
        });
        return transform.url + '?' + new URLSearchParams(transform.params).toString()
    }

// Routine to generate an index reply after some other action is done.
// Since the promise was created by the caller, we use that to signal done.
   returnIndex(path, resolve, reject) {
		
		if (path.startsWith("null://")) {
			path = path.substring(6);
		}

		if (path.startsWith("//")) {
			path = path.substring(1);
		}

  	let reply = getDirInfo(path, (err, data)=>{
  		// Convert from cascade to VueFinder)
  		let dirInfo = {
    			"adapter": "null",
    			"storages": [
        		"local",
        		"media",
       		 "media-rw"
   				 ],
   				 
   				 "dirname": path
  		};

  		let files = [];
			if (data !== undefined) for (const de of data) {
				const d = fdatetime2Date(de.date, de.time);

				let fe = { 
					 "visibility": "public",
           "last_modified": d.getTime() / 1000.0
        };
        if (de.attr & 0x10) {
					fe.type = "dir";
					fe.path = path + "/" + de.name;
					fe.mime_type =  null;
					fe.basename = de.name;
					fe.extension = de.name;
					fe.storage = null;
					fe.file_size = 0;
				} else {
					fe.type = "file";
					fe.path = path + "/" + de.name;
					fe.mime_type = "text/plain";
					let parts = de.name.split('.');
					let ext = '';
					let fname = '';
					if (parts.length > 1) ext = parts[parts.length - 1];
					fname = de.name;
					fe.basename = fname;
					fe.extension = ext;
					fe.storage = null;
					fe.file_size = de.size;
					fe.mime_type = guessMimeType(fname);
				}
				files.push(fe);
			}
			dirInfo.files = files;
  		resolve(dirInfo);
  	});
  }

   handleIndex(req) {
		let path = req.params.path;
		if (path === undefined) {
			path = '/';
		}

		let { promise, resolve, reject } = Promise.withResolvers();

		this.returnIndex(path, resolve, reject);
		return promise;

	}


 handlePreview(req, signal) {
  	console.log("Downloading: " + req);
  	
  	let { promise, resolve, reject } = Promise.withResolvers();

		let readPath = getRidOfDoubleLeadingSlashes(req.params.path);
		let stopIt = readFile(readPath, (readPath, err, data)=>{
				if (err === undefined || err == 0) {
					 if (isTextFile(readPath)) {
					 let asText = new TextDecoder().decode(data);
					 resolve(asText);
					} else {
						resolve(data);
					}
				}
		});

		if (signal !== undefined) {
			// If the signal is already aborted, immediately throw in order to reject the promise.
    	if (signal.aborted) {
      	reject(signal.reason);
    	}
	    signal.addEventListener("abort", () => {
      	// Stop the main operation
      	// Reject the promise with the abort reason.
      	stopIt();
      	reject(signal.reason);
    	});
		}
  	return promise;
  }
  
 
  handleDownload(req, signal) {

  	let { promise, resolve, reject } = Promise.withResolvers();
		let dlPath = getRidOfDoubleLeadingSlashes(req.params.path);

     var dirPromise = window.showDirectoryPicker({
         mode: 'readwrite'//ask for write permission
     }).then((dirHand) =>{
				downloadOneItem(dlPath, dirHand).then(()=>{resolve()}).catch(err=>{
					if (err !== 4) {
							console.log("Error from download: " + err);
							reject (err);
							return;
					}

					let daughter = "";
					let parts = dlPath.split("/");
					if (parts.length > 0) {
						daughter = parts[parts.length - 1];
					}
				// Create a daughter directory if needed.
					dirHand.getDirectoryHandle(daughter, {create: true})
					.then( (daughterDirHandle)=>{
						recursiveDownload(dlPath, daughterDirHandle);
						}
					)
					.then(()=>{resolve()});
				}); // end of catch function.
     });

  	return promise;
  }
 
 	convertStringToUint8Array(str) {
 		const uint8 = new Uint8Array(str.length);
		for (let i = 0; i < str.length; i++) {
  			uint8[i] = str.charCodeAt(i);
		}
 		return uint8;
 	}
 
 
  handleSave(req, dataIn, signal) {
  	let lastProgress = -1;
  	let { promise, resolve, reject } = Promise.withResolvers();
		let data = dataIn;
		if (typeof dataIn == 'string') {
			data = this.convertStringToUint8Array(dataIn);
			console.log(data);
		}
		let savePath = getRidOfDoubleLeadingSlashes(req.params.path);
		console.log(savePath);

		let abortFunction = writeToFile(savePath, data, (err) => {
        	if (err === 0) {
							resolve(dataIn);
        		} else {
        				reject(err);
        		}
    			}, (sofar, total)=> {
    					let nowPer = Math.round((sofar/total) * 10);
    					if (nowPer > lastProgress) {
    						  console.log("Progress: " + nowPer * 10);
    						  lastProgress = nowPer;
    						}
    });

		if (signal !== undefined) {
			// If the signal is already aborted, immediately throw in order to reject the promise.
    	if (signal.aborted) {
      	reject(signal.reason);
    	}
	    signal.addEventListener("abort", () => {
      	// Stop the main operation
      	// Reject the promise with the abort reason.
      	reject(signal.reason);
    	});
		}
  	return promise;
  }
  
 handleDelete(req) {
  	let { promise, resolve, reject } = Promise.withResolvers();
  	let bod = req.body;
  	let itemList = bod.items;
  	let itemIndex = 0;
 
 		let lastDir;
 		let that = this;
  	function deleter() {
  		if (itemIndex >= itemList.length) {
  			that.returnIndex(lastDir, resolve, reject);
  		} else {
  			let aItem = itemList[itemIndex];
  			let aPath = getRidOfDoubleLeadingSlashes(aItem.path);
  			let spltz = aPath.split('/');
  			spltz.pop();
  			lastDir = spltz.join('/');
  			itemIndex++;
  			let del = {path: aPath};
  			recursiveDelete(aPath, aItem.type === 'dir').then((d)=>deleter());
  		}
  	}
		deleter();
  	return promise;
  }
  
handleNewFolder(req) {
	  	let { promise, resolve, reject } = Promise.withResolvers();
	  	let path = req.params.path;
	  	let name = req.body.name;
	  	let fullPath = path + '/' + name;
	  	let dt = date2fdatetime(new Date());
	  	let params = {date: dt.fdate, time: dt.ftime, path: fullPath};
  		sendJsonRequest("mkdir", params,(verb, object, data, payoff, zeroX)=>{
  			let params = object[verb];
  			if (params.err !== 0) {
  				reject(params.err);
  			} else {
  					this.returnIndex(path, resolve, reject);
   			}
  		});
	  	return promise;
}

handleRename(req) {
	  	let { promise, resolve, reject } = Promise.withResolvers();
	  	let path = req.params.path;
	  	let name = req.body.name;
	  	let item = req.body.item;
	  	let toName = path + '/' + name;
  		sendJsonRequest("rename", {from: item, to: toName},(verb, object, data, payoff, zeroX)=>{
  			let params = object[verb];
  			if (params.err !== 0) {
  				reject(params.err);
  			} else {
  					this.returnIndex(path, resolve, reject);
   			}
  		});
	  	return promise;
}

    /**
     * Send request
     * @param {Object} input
     * @param {String} input.url
     * @param {'get'|'post'|'put'|'patch'|'delete'} input.method
     * @param {Record<String,String>=} input.headers
     * @param {Record<String,?String>=} input.params
     * @param {(Record<String,?String>|FormData|null)=} input.body
     * @param {'arrayBuffer'|'blob'|'json'|'text'=} input.responseType
     * @param {AbortSignal=} input.abortSignal
     * @returns {Promise<(ArrayBuffer|Blob|Record<String,?String>|String|null)>}
     * @throws {Record<String,?String>|null} resp json error
     */
    send(input) {
        const reqParams = this.transformRequestParams(input);
        const responseType = input.responseType || 'json';
        /** @type {RequestInit} */
        const init = {
            method: input.method,
            headers: reqParams.headers,
            signal: input.abortSignal,
        };
        const url = reqParams.url + '?' + new URLSearchParams(reqParams.params);
        if (reqParams.method !== 'get' && reqParams.body != null) {
            /** @type {String|FormData} */
            let newBody
            if (!(reqParams.body instanceof FormData)) {
                // JSONreqParams.body
                newBody = JSON.stringify(reqParams.body);
                init.headers['Content-Type'] = 'application/json';
            } else {
                // FormData
                newBody = input.body;
            }
            init.body = newBody;
        }
        
 			let prom;
 			switch (input.params.q) {
 				case 'index': 
 							prom = this.handleIndex(reqParams);
 							break;

 				case 'download':
 				 			prom = this.handleDownload(reqParams, init.signal);
 							break;

				case 'upload': 
							// prom = this.handleUpload(reqParams, newBody);
 							break;

				case 'save': 
							let data = reqParams.body.content;
							//if (responseType === 'text') {
							//	 const encoder = new TextEncoder();
							//	 data = encoder.encode(data);
							// }
							prom = this.handleSave(reqParams, data, init.signal);
 							break;
				case 'preview': 
							prom = this.handlePreview(reqParams, init.signal);
 							break;

 				case 'delete':
 							prom = this.handleDelete(reqParams);
 						  break;

 				case 'newfolder':
 							prom = this.handleNewFolder(reqParams);
 						  break;  
 
				case 'rename':
						  prom = this.handleRename(reqParams);
						  break;
	
 				default: console.log("Undefined query type for send(): " + input.params.q);
 							break;

 			}
 			return prom;
    }
} // End of class Requester

/**
 * Build requester from user config
 * @param {String|RequestConfig} userConfig
 * @return {Requester}
 */
export function buildRequester(userConfig) {
    /** @type {RequestConfig} */
    const config = {
        baseUrl: '',
        headers: {},
        params: {},
        body: {},
        xsrfHeaderName: 'X-CSRF-Token',
    };
    if (typeof userConfig === 'string') {
        Object.assign(config, { baseUrl: userConfig });
    } else {
        Object.assign(config, userConfig);
    }
    return new Requester(config);
}
