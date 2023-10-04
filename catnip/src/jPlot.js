import $ from'jquery';

// This was Jamie's first attempt at a plotter. Replaced by uPlot.

// Draws a line without using a canvas. Uses a long thin <div> that is rotated.
// from Craig Tab via https://stackoverflow.com/questions/14560302/html-line-drawing-without-canvas-just-js
// improved by Davide.
function linedraw(x1, y1, x2, y2) {
  if (x2 < x1) {
    var tmp;
    tmp = x2 ;
    x2 = x1 ;
    x1 = tmp;
    tmp = y2 ;
    y2 = y1 ;
    y1 = tmp;
  }

  var lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  var m = (y2 - y1) / (x2 - x1);

  var degree = Math.atan(m) * 180 / Math.PI;

  //let str = "<div class='line' style=\"transform-origin: top left; transform: rotate(' + degree + 'deg); width: ' + lineLength + 'px; height: 1px; background: black; position: absolute; top: ' + y1 + 'px; left: ' + x1 + 'px;\"></div>";
  let str = "<div class='line' style='transform-origin: top left; transform: rotate(" + degree + "deg); width: " + lineLength + "px; height: 1px; background: black; position: absolute; top: " + y1 + "px; left: " + x1 + "px;'></div>";
  //console.log(str); 
  return $(str);
}

class jPlot {

    constructor(scanner) {
  	this.scanner = scanner;
  	this.scaleFactor  = viewer.timeScale;
  	this.trackMap = new Map();
  	this.flipped = true;
    this.maxY = 0;
    this.plotHeight = lastPlotHeight;
    this.laneHeight = 16;
    this.timeScale = lastTimeScale;

  }


  assignRows() {
    this.trackMap.clear();
    let y = 0;
    for (let i = 0; i < this.trackOrder.length; ++i)
    {
      let tag = this.trackOrder[i];
      this.trackMap.set(tag, y);
      y += this.viewer.minRange.has(tag) ? this.plotHeight +  (this.laneHeight / 2) : this.laneHeight;
    }
    
    this.maxY = y;
  }
  
  render() {
  	let performance = window.performance;
  	let rstart = performance.now();
  	let view = this.viewer;

    let firsttime = view.minAbsTime;
    let lastX = (view.maxAbsTime - view.minAbsTime) / view.timeScale;
    let timeline = $("<div/>");
    let lastXMap = new Map();
    let lastYMap = new Map();
    let lastEventForTag = new Map();
    timeline.addClass('timeline');
    let maxWidth = ((view.maxAbsTime - view.minAbsTime) / view.timeScale);
		timeline.css("width", maxWidth + "px");
		timeline.css("height", (view.maxY + view.laneHeight) + "px");
    for (let i = 0; i < view.events.length; ++i) {
      let evt = view.events[i];
      let relT = evt.absStart - firsttime;
      let tag = evt.tag;
      let item = $('<div/>');
      let y = view.trackMap.get(evt.tag);
      if (evt.value != undefined)
      {
        let minV = view.minRange.get(tag);
        let maxV = view.maxRange.get(tag);
        let range = (maxV - minV);
        if (range === 0) range = 1;
        y += view.plotHeight - (((evt.value - minV) * view.plotHeight) / range);
        let x = relT / view.timeScale;
        if (view.flipped) {
        	x = lastX - x;
        }
        if (lastXMap.has(tag)) {
        	 let x0 = lastXMap.get(tag);
        	 let y0 = lastYMap.get(tag);
           item = linedraw(x0, y0, x, y);
        }
  
        item.addClass('valueplot');
        lastXMap.set(tag, x);
        lastYMap.set(tag, y);
      } else {
        item.addClass('eventItem');
        let t1 = evt.absStart - firsttime;
        let t2;
        if (evt.duration > 0) {
   				t1 = evt.absStart - firsttime;
   				t2 = t1 + evt.duration;
        } else if (evt.endEvent) {
        // This is an "ending event", so draw the bar from the previous event to here.
        	let prevX = view.searchForPreviousEvent(view.events, i, evt.tag);
        	if (prevX < 0) continue;
          t2 = view.events[prevX].absStart - firsttime;
        } else {
        	t2 = t1;
        }

				let width = 2;
				if (t1 != t2) {
        	width = Math.abs(t2 - t1) / view.timeScale;
  			}
        if (width < 1) width = 1;
   
        let x = t1 /  view.timeScale;
        if (view.flipped) {
        	x = (lastX - x);
        } else {
        	x -= width;
        }
        item.css("width", width + "px");
        item.css("left", x + "px");
        item.css("top", y + "px");
      }

      item.css("background-color", evt.color);
      item.attr('data-eid', i);
      item.addClass('evt');
      timeline.append(item);
      lastEventForTag.set(tag, evt);
    }

    this.addTagLabelsTo(timeline);
    $("#plot").empty();
    $("#plot").append(timeline);
    /*
    let plot = $("#plot");
    plot.css("width", maxWidth + "px");
		plot.css("height", (this.maxY + this.laneHeight) + "px");css("width", );
		*/
		//if (!sysExRunning) activateTippy();
		//	else tippyActive = false;
    let rend = performance.now();
    console.log("Time to render: " + (rend - rstart));
  }

  addTagLabelsTo(timeline) {

	  let keyDiv = $("<div class='overlay' style='top: 0px;left:0px'></div");
	  let scanner = this.scanner;
	  for (let i = 0; i < scanner.trackOrder.length; ++i) {
	  	let tag = scanner.trackOrder[i];
	  	let y = scanner.trackMap.get(tag);
	  	let labline = $("<div class='linelabel'/>");
	  	labline.css("top", y + "px");
	  	labline.text(tag);
	  	keyDiv.append(labline);
	  }
		timeline.append(keyDiv);
  }

};


export {jPlot};