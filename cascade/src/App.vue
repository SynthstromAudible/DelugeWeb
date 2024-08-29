<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './Catscade.vue'
<link rel="stylesheet" href="css/app.css">
<link rel="stylesheet" href="css/uPlot.min.css">
</script>

<template>
  <header>

    <title>View Events</title>
  </header>

    <script type="module" src="/src/viewEvents.js"></script>
 <div id="app"></div>

<input id='opener' name="file" type="file" accept=".txt,.log" />
Scale:
<select id = "scale" >  
<option selected='true'>seconds</option>  
<option>milliseconds</option>  
<option>microseconds</option>
</select>&nbsp;
&nbsp;
Graph&nbsp;Height:
<select id = "plotH" >  
<option>50</option>
<option>80</option>
<option selected='true'>100</option>
<option>150</option>
<option>200</option>
<option>250</option>
<option>300</option>
<option>400</option>
<option>500</option>
</select>&nbsp;pixels.
<br/>Midi:
     in: <select id="chooseIn"><option label="(none)" value="" id="noneInput"/></select>
     out: <select id="chooseOut"><option label="(none)" value="" id="noneOutput"/></select>
     &nbsp;
     <button type="button" id="getDebugButton">Start SysEx</button>
     &nbsp;
     <button type="button" id="stopDebugButton">Stop SysEx</button>
     &nbsp;
		 <button type="button" id="clearbut">Clear</button>
<p/>
		 <div class="timeline" id="plot">
		</div>
		<hr/>
		<div class="uplot" id="uplot">
			
		</div>
		<div class="uplotl" id="uplotl">
			
		</div>
		<hr/>
				 <div class='status' id="midiStatus">inactive</div>
     <div id="debugOutput" class="outbox">
     </div>
  </body>
</template>

<style scoped>
canvas {
  border:1px solid #000000;
}

.outbox {
  border:1px solid #000000;
  overflow-y: scroll;

  display: flex;
  flex-direction: column-reverse;

  height: 160px;
  margin-bottom: 10px;
  margin-right: 30px;
}

div.timeline {
	position: relative;
	background-color:#fffffc;
	left:		64px;
	// height: 512px;
}

div.eventItem {
	position: absolute;
	height: 12px;
	background-color:#202020;
}


div.line {
	
}

div.linelabel {
	position: absolute;
	left: -60px;
	font-size:12px;
}

.overlay{
  position:absolute;
  width:64px;
  background-color:rgba(0, 0, 0, 0.0);
  pointer-events: none;
}

.linelabel {
  text-align:left;
  background-color:black;
  font-size:10px;
  color:white;
}

.stripe {
	position:absolute;
	background-color:#f8ffff;
}

.gridline {
	  position:absolute;
		background-color:#e0e0e0;
}
</style>
