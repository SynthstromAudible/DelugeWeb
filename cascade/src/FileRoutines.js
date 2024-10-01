  import {sendJsonRequest, GetAttachedUint8Array, pack8bitTo7bit} from "./JsonReplyHandler.js";
  import {editText, editPath, setOpener, waverly} from "./common.js";

  const blockSize = 256;

	const timeIt = true;
// doneCB(path, err, data);
function readFile(readPath, doneCB) {

    let startT;
    let endT;
    let startR;
    let endR;

    if (timeIt) startT = Date.now();

    let working;
    let highestAskedFor = 0;
    let fileAllRead = false;

    function closeDone(verb, object, data, payoff, zeroX) {
        let resp = object[verb];
        if (doneCB) doneCB(readPath, resp.err, working);
    }

    function closeWithError(fid, err) {
        let clos = {};
        clos.fid = fid;
        sendJsonRequest("close", clos, () => {});
        if (doneCB) doneCB(readPath, err);
    }

    function readCallback(verb, object, data, payoff, zeroX) {
        let resp = object[verb];
        if (fileAllRead) return;
        if (resp.err != 0) {
            closeWithError(resp.fid, resp.err);
            return;
        }

        let attached = GetAttachedUint8Array(data, zeroX);
        let blkadd = resp.addr;

        if (attached.length > 0) {
            working.set(attached, blkadd);
        } else {
            let clos = {};
            clos.fid = resp.fid;
            sendJsonRequest("close", clos, closeDone);
            if (!timeIt) return;
            endT = Date.now();
            let dT = endT - startT;
            console.log("dT: " + dT);
            return;
        }

        let params = {};
        params.fid = resp.fid;
        params.addr = highestAskedFor;
        highestAskedFor += blockSize;
        params.size = blockSize;
        sendJsonRequest("read", params, readCallback);
    }

    function openCallback(verb, object, data, payoff, zeroX) {
        let resp = object[verb];

        if (resp.err != 0) {
            if (doneCB !== undefined) doneCB(readPath, resp.err);
            return;
        }
        working = new Uint8Array(resp.size);

        highestAskedFor = 0;
        fileAllRead = false;

        console.log("Size: " + resp.size);
        let params = {};
        params.fid = resp.fid;
        params.addr = highestAskedFor;
        params.size = blockSize;
        if (resp.fid === undefined || resp.fid < 1) {
            console.log("*** bad file open");
            if (doneCB !== undefined) doneCB(-1);
            return;
        }
        highestAskedFor += blockSize;
        sendJsonRequest("read", params, readCallback);
    }

    // Kick the process off by openning the file to read.
    let params = {};
    params.path = readPath;
    sendJsonRequest("open", params, openCallback);
}

function openAndConvert(path) {
    readFile(path, async (pathRead, err, dataRead) => {
        if (err != 0) {
            console.log("Error returned: " + err);
            return;
        }
        if (dataRead == undefined) {
            console.log("Empty File returned to openAndConvert");
            return;
        }
        if (pathRead.toLowerCase().endsWith('wav')) {
            const audioContext = new AudioContext();
            let decoded = await audioContext.decodeAudioData(dataRead.buffer);
            waverly(decoded);
        } else {
            const decoder = new TextDecoder();
            let str = decoder.decode(dataRead);
            editText.value = str;
        }
    });
}
// Setup link through common.js so others can call it.
	setOpener(openAndConvert);

// doneCB(err);
function writeToFile(path, fromByteArray, doneCB) {
    let toWrite = fromByteArray.length;
    let writtenSoFar = 0;
    let writeOffset = 0;

		function callDone(verb, js) {
		  let resp = js[verb];
			if (doneCB !== undefined) doneCB(resp.err);
		}

    function closeWrite(fid) {
        let clos = {};
        clos.fid = fid;
        sendJsonRequest("close", clos, callDone);
    };

    function writeNext(verb, js, data, payloadOffset, zeroX) {
        let resp = js[verb];
        if (resp.err != 0 || writtenSoFar >= toWrite) {
            closeWrite(resp.fid);
            return;
        } else {
            writtenSoFar += resp.size;
            let params = {};
            params.fid = resp.fid;
            params.addr = writtenSoFar;
            let sizeToWrite = toWrite - writtenSoFar;
            if (sizeToWrite > blockSize) sizeToWrite = blockSize;
            params.size = sizeToWrite;
            let packed = pack8bitTo7bit(fromByteArray, writtenSoFar, sizeToWrite);
            sendJsonRequest("write", params, writeNext, packed);
            return;
        }
    }

    // Kickoff the writing with a fake initial request.
    function postOpen(verb, js, data, payloadOffset, zeroX) {
        let openPB = js[verb];
        if (openPB.err != 0) {
        	console.log("Error opening for writing: " + openPB.err);
        	if (doneCB !== undefined) doneCB(openPB.err);
        	return;
        }
        // create a fake writeNext to start things.
        // if more params are actually used, include them below.
        let kickoff = {
            "dummy": {
                "fid": openPB.fid,
                "size": 0,
                "err": 0
            }
        };
        writeNext("dummy", kickoff);
    }

    let oparams = {};
    oparams.path = path;
    oparams.write = 1;
    sendJsonRequest("open", oparams, postOpen);
}


function upload() {
    let params = {};
    params.addr = 0;
    params.size = 1025;
    let upbuf = new Uint8Array(params.size);
    for (let i = 0; i < upbuf.length; ++i) {
        upbuf[i] = i;
    }

    writeToFile('/TEST/afurrtest2.bin', upbuf, () => {
        console.log("DONE UPLOAD");
    });
}

 	function ping() {
 		 let pingCtr= 100;
 		 let startT;
 		 let params = {};

 		 function reping() {
 	 	 	pingCtr--;
	 	 	if (pingCtr > 0) {
	 	 		 	 sendJsonRequest("ping", params, reping);
	 	 	} else {
	 	 		if (timeIt) {
	 	 			let endT = Date.now();
	 	 			let dT = endT - startT;
					console.log("dT: " + dT);
				}
	 	 	}
	 	 	 //console.log("pong " + pingCtr);	 
 		 };
 		 if (timeIt) startT = Date.now();
	 	 sendJsonRequest("ping", params, reping);
 	}
 
 	const linesPerRequest = 20;

// dirDoneCB(err, entriesArray);
	function getDirInfo(dirpath, dirDoneCB) {
	    let working = [];

	    let dirCB = function(verb, object, data, payoff) {
	        let resp = object[verb];
	        if (resp.err !== undefined && resp.err != 0) {
	            console.log("getDirInfo error: " + resp.err);
	            if (dirDoneCB !== undefined) dirDoneCB(resp.err);
	            return;
	        }
	        working = working.concat(resp.list);
	        if (resp.list !== undefined && resp.list.length > 0) {
	            let params = {
	                offset: working.length,
	                lines: linesPerRequest,
	                path: dirpath
	            };
	            sendJsonRequest("dir", params, dirCB);
	        } else {
	        		if (dirDoneCB !== undefined) dirDoneCB(resp.err, working);
	        }
	    }

	    let params = {
	        offset: 0,
	        lines: linesPerRequest,
	        path: dirpath
	    };

	    sendJsonRequest("dir", params, dirCB);
	}

export {readFile, openAndConvert, writeToFile, upload, ping, getDirInfo}
