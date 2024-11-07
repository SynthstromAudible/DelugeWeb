 import {delugeOut} from "./mididriver.js";
 
let callbackDirectory = new Map();

let callbackIndexArray = new Array(128);


  function handleJsonCB(data, payloadOffset) {
  
  	  let zeroX = data.length - 1;
  	  let replyID = data[payloadOffset + 1];
  		for (let i = payloadOffset + 2; i < (data.length - 1); ++i)
  			if (data[i] == 0) {
  					zeroX = i;
  					break;
  			}
   	  let textPart = data.subarray(payloadOffset + 2, zeroX);
  	  let dec = new TextDecoder().decode(textPart);
  	  //console.log(dec);
  	  let js = JSON.parse(dec);
  	  let verb;
 			let furr = dec;
 			let purr = textPart;
 		
  	  for (const v in js) {
  	  	verb = v;
  	  	break;
  	  }

  	  let callee = undefined;

  	  if (replyID === 0) {
  	  	if (callbackDirectory.has(verb)) {
  	  		callee = callbackDirectory.get(verb);
  	  	}
  	  } else
  	     if (callbackIndexArray[replyID] !== undefined) {
  	  	  callee = callbackIndexArray[replyID];
  	  }

  	  if (callee !== undefined) {
  	  		callee(verb, js, data, payloadOffset, zeroX);
  	  		callbackIndexArray[replyID] = undefined;
  	  } else {
  	  	console.log("*** undefined callback for Json msg: " + verb + " " + js);
  	  }
}

let msgSeqNumber = 1; // The "next" msg sequence # to send.

const sep = new Uint8Array([0x00]);
const suffix = new Uint8Array([0xf7]);
function sendJsonRequest(cmd, body, callback, aux) {
		 let seqNumberSent = msgSeqNumber;
		 let prefix = new Uint8Array([0xf0, 0x00, 0x21, 0x7B, 0x01, 0x04, msgSeqNumber]);
		 msgSeqNumber++;
		 if (msgSeqNumber >= 128) msgSeqNumber = 1;
		 let msgOut = {}
		 msgOut[cmd] = body;
	   let cmdLine = JSON.stringify(msgOut);

		 const textEncoder = new TextEncoder();
		 const cmdBytes = textEncoder.encode(cmdLine);

		 let msg;
		 if (aux !== undefined) {

		 	 msg = mergeUint8Arrays(prefix, cmdBytes, sep, aux, suffix);
		} else {
			 msg = mergeUint8Arrays(prefix, cmdBytes, suffix);
		}
		callbackIndexArray[seqNumberSent] = callback;
	  delugeOut.send(msg);
	  return seqNumberSent;
}


// https://www.codeconvert.ai/c-to-javascript-converter
function pack8bitTo7bit(src, srcOffset, srcLen) {
    const packets = Math.ceil(srcLen / 7);
    const missing = (7 * packets - srcLen); // allow incomplete packets
    const outLen = 8 * packets - missing;

		let dst = new Uint8Array(outLen);

    for (let i = 0; i < packets; i++) {
        const ipos = 7 * i;
        const opos = 8 * i;
        dst.fill(0, opos, opos + 8);
        for (let j = 0; j < 7; j++) {
            // incomplete packet
            if (!(ipos + j < srcLen)) {
                break;
            }
            dst[opos + 1 + j] = src[srcOffset + ipos + j] & 0x7f;
            if (src[srcOffset + ipos + j] & 0x80) {
                dst[opos] |= (1 << j);
            }
        }
    }
    return dst;
}

function unpack_7bit_to_8bit(dst, dst_size, src, srcOff, src_len) {
    let packets = Math.ceil(src_len / 8);
    let missing = (8 * packets - src_len);
    if (missing === 7) { // this would be weird
        packets--;
        missing = 0;
    }
    let out_len = 7 * packets - missing;
    if (out_len > dst_size) {
        return 0;
    }
    for (let i = 0; i < packets; i++) {
        let ipos = 8 * i;
        let opos = 7 * i;
        dst.fill(0, opos, opos + 7);
        for (let j = 0; j < 7; j++) {
            if (!(j + 1 + ipos < src_len)) {
                break;
            }
            dst[opos + j] = src[srcOff + (ipos + 1 + j)] & 0x7f;
            if (src[ipos + srcOff] & (1 << j)) {
                dst[opos + j] |= 0x80;
            }
        }
    }
    return 8 * packets;
}

// Function to pre-determine the output array size
function calcResultSize(src_len) {
    let packets = Math.ceil(src_len / 8);
    let missing = (8 * packets - src_len);
    if (missing === 7) { // this would be weird
        packets--;
        missing = 0;
    }
    let out_len = 7 * packets - missing;
    return out_len;
}

function GetAttachedUint8Array(data, zeroX) {
		let totLen = data.length;
		let attLen = totLen - zeroX - 2; // Ignore 0 separator & ending 0xF7.
		let binLen = calcResultSize(attLen);
		let binData = new Uint8Array(binLen);
		let res = unpack_7bit_to_8bit(binData, binLen, data, zeroX + 1, attLen);
		return binData;
}

// https://stackoverflow.com/questions/49129643/how-do-i-merge-an-array-of-uint8arrays
function mergeUint8Arrays(...arrays) {
  const totalSize = arrays.reduce((acc, e) => acc + e.length, 0);
  const merged = new Uint8Array(totalSize);

  arrays.forEach((array, i, arrays) => {
    const offset = arrays.slice(0, i).reduce((acc, e) => acc + e.length, 0);
    merged.set(array, offset);
  });

  return merged;
}




export {sendJsonRequest, handleJsonCB, GetAttachedUint8Array, pack8bitTo7bit};