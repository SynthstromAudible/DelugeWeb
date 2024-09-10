  import {setJsonCallback} from "./mididriver.js";
  import dirList from "./DirView.vue";
  
  let ref;
  function handleJsonCB(data, payloadOffset) {
  	
   	  let textPart = data.subarray(payloadOffset + 1, data.length - 1);
  	  let dec= new TextDecoder().decode(textPart);
  	  let js = JSON.parse(dec);

			if (js.dirlist) {
				console.log(js);
				ref.value = js.dirlist;
			}
  }
 
 function setupJSON() {
  setJsonCallback(handleJsonCB);
}

function notifyRef(r) {
	ref = r;
}
export {setupJSON, notifyRef};