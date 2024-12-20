import {handleJsonCB, requestSessionId} from "./JsonReplyHandler.js";
/** @type {MIDIAccess} */
let midi = null;
/** @type {MIDIInput} */
let delugeIn = null;
/** @type {MIDIOutput} */
let delugeOut = null;

let sysExCallback;
let jsonCallback;

let textref;
let statusRef;

export var sysExRunning = false;

// Create a fake object to absorb jquery functions
// for objects not found in the html document
// without freaking out.
let dummyObj = {
		innerText: "",
		children: [],
		append: ()=>{},
		selected: false
};

function htmlElement(selector) {
	let elem = document.querySelector(selector);
	if (elem !== undefined && elem !== null) return elem;
	return dummyObj;
}

function setstatus(text) {
	if (statusRef !== undefined) {
		statusRef.value = text;
		return;
	}
	// The following does not work well when midiStatus is inside a Vue component.
	let statusElem = htmlElement("#midiStatus");
	statusElem.innerText = text;
}

function populateDevices() {
  for (const entry of midi.inputs) {
    const port = entry[1];
    const opt = new Option(port.name, port.id);
    htmlElement("#chooseIn").append(opt);
    if (port.name.includes("Deluge Port 3")) {
      opt.selected = true;
      setInput(port);
    }
  }
  for (const entry of midi.outputs) {
    const port = entry[1];
    const opt = new Option(port.name, port.id);
    htmlElement("#chooseOut").append(opt);
    if (port.name.includes("Deluge Port 3")) {
      opt.selected = true;
      delugeOut = port;
    }
  }
}

function setInput(input) {
  if (delugeIn == input) {
    return;
  }
  if (delugeIn != null) {
    delugeIn.removeEventListener("midimessage", handleData);
  }
  delugeIn = input;
  if (delugeIn != null) {
    //handleData.on("midimessage", handleData);
    delugeIn.addEventListener("midimessage", handleData);
  }
}

function onChangeIn(ev) {
  const id = ev.target.value;
  setInput(midi.inputs.get(id))
}

function onChangeOut(ev) {
  const id = ev.target.value;
  console.log("choose the id:" + id)
  delugeOut = midi.outputs.get(id) || null;
  console.log("choose the port:" + delugeOut)
}

function onStateChange(ev) {
  const port = ev.port;
  const delet = (port.state == "disconnected");
  if (port.type == "input") {
    let found = false;
    let elem = htmlElement("#chooseIn");
    let children = elem.children;
    for (let i=0; i < children.length; i++) {
      if (children[i].value == port.id) {
        found = true;
        if (delet) {
          children[i].remove();
          if (port == delugeIn) {
            htmlElement("noneInput").selected = true;
            // or maybe not, if id: are preserved during a disconnect/connect cycle
            setInput(null);
          }
          break;
        }
      }
    }
    if (!found && !delet) {
      const opt = new Option(port.name, port.id);
      htmlElement("#chooseIn").append(opt);
    }
  } else {
    let found = false;
    let children = htmlElement("#chooseOut").children;
    for (let i=0; i < children.length; i++) {
      if (children[i].value == port.id) {
        found = true;
        if (delet) {
          children[i].remove();
          if (port == delugeOut) {
            htmlElement("#noneOutput").selected = true;
            // or maybe not, if id: are preserved during a disconnect/connect cycle
            delugeOut = null;
          }
          break;
        }
      }
    }
    if (!found && !delet) {
      const opt = new Option(port.name, port.id);
      htmlElement("#chooseOut").append(opt);
    }
  }
}

function onMIDISuccess(midiAccess) {
  setstatus("webmidi ready");
  midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
  populateDevices();
  midi.addEventListener("statechange", onStateChange);
  requestSessionId();
}

function onMIDIFailure(msg) {
  setstatus(`Failed to get MIDI access :( - ${msg}`);
}

function getDebug() {
    delugeOut.send([0xF0, 0x00, 0x21, 0x7B, 0x01, 0x03, 0x00, 0x01, 0xf7]);
    sysExRunning = true;
}

function stopDebug() {
    delugeOut.send([0xF0, 0x00, 0x21, 0x7B, 0x01, 0x03, 0x00, 0x00, 0xf7]);
    sysExRunning = false;
}


window.addEventListener('load', function() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then( onMIDISuccess, onMIDIFailure );
  } else {
    setstatus("webmidi unavail, check browser permissions");
  }

  return;
});

let lastmsg;

/** @param {MIDIMessageEvent} msg */
function handleData(msg) {
  lastmsg = msg
  // console.log(msg.data);
  decode(msg.data)
}

let lineBuff = [];
let lineMax = 1000;

function clearLog() {
	lineBuff = [];
	if (textref !== undefined) textref.value = "";
}
function decode(data) {
	let hasDelugeID = false;
	let payloadOffset = 2;

	if (data.length > 6) {
				 hasDelugeID = data[1] == 0x00 && data[2] == 0x21 && data[3] == 0x7B && data[4] == 0x01;
				 if (hasDelugeID) payloadOffset = 5;
	}
	if (data[1] == 0x7d) hasDelugeID = true;
  if (data.length < (payloadOffset + 1) || data[0] != 0xf0 || !hasDelugeID) {
    console.log("foreign sysex?");
//  console.log(data);
    return;
  }
  //    if (data.length >= 5 && data[2] == 0x03 && data[3] == 0x40) {
    if (data.length >= (payloadOffset + 3) && data[payloadOffset] == 0x03 && data[payloadOffset + 1] == 0x40) {
  //     let msgbuf = data.subarray(5, data.length-1);
    let msgbuf = data.subarray(payloadOffset + 3, data.length-1);
    let message = new TextDecoder().decode(msgbuf);
    if (sysExCallback !== undefined) {
      	if (sysExRunning) sysExCallback(message);
    }

    lineBuff += message;

    let chunks = lineBuff.split('\n');
    let linect = chunks.length;
    if (linect > lineMax) {
    	chunks = chunks.slice(linect - lineMax);
    }
  	lineBuff = chunks.join("\n");
		let html = chunks.join("<br>");
		
		if (textref !== undefined) {
			textref.value = html;
		}
  } else if (data.length >= (payloadOffset + 3) && (data[payloadOffset] == 0x04 || data[payloadOffset] == 0x05)) {
  		 handleJsonCB(data, payloadOffset);
  }
}

// Not used yet.
function setRefresh() {
  if (theInterval != null) {
    clearInterval(theInterval)
    theInterval = null;
  }

  //theInterval = setInterval(function() { renderBlock; }, 100);
}

function setSysExCallback(callback) {
	sysExCallback = callback;
}

function informRef(ref, statRef)
{
	textref = ref;
	statusRef = statRef;
}

export {setSysExCallback, getDebug, stopDebug, onChangeIn, onChangeOut, clearLog, delugeOut, informRef};