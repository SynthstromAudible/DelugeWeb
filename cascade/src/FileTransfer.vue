 <script setup>
  import {readFile, openAndConvert, writeToFile, upload, ping} from "./FileRoutines.js";
  import {ref} from 'vue';
  import {sendJsonRequest, GetAttachedUint8Array, pack8bitTo7bit} from "./JsonReplyHandler.js";
  import {editText, editPath, setOpener, waverly} from "./common.js";
  import { useRoute, useRouter } from 'vue-router';
 </script>

<template>
<hr/><br/>
<button type="button" id="ping" @click="ping">Ping</button>
<button type="button" id="uploadButton" @click="upload">Upload</button>
</template>
