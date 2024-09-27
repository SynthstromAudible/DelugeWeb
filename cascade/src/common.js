  import {ref} from 'vue';

let editText = ref("");
let editPath = ref("/");
let editBlob = ref(null);

let openEditOn;
let waverly;

function setOpener(opener) {
	openEditOn = opener;
}

function setWave(wv) {
	waverly = wv;
}

export {editText, editPath, setOpener, openEditOn, editBlob, waverly, setWave};