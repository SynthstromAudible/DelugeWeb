  import {ref} from 'vue';

let editText = ref("");
let editPath = ref("/");

let openEditOn;

function setOpener(opener) {
	openEditOn = opener;
}


export {editText, editPath, setOpener, openEditOn};