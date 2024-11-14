import $ from 'jquery';
import {FileWidget} from './FileWidget.js';
import HandleBars from 'handlebars'


let open_frame = `
<div id="filewidget" class="modal">
  <div class="filewidget">
	<div class="fw-header">
	  <span class="fw-close">&times;</span>
	  <h4>Select File to Open</h4>
	</div>
	<div class="fw-body">
			<div id="header">
			</div>
			<div class="wrapper">
			</div>
	</div>
	<div class="fw-footer">
	<table><tr>
		<td width='100%'><label class='inlab'>Open:&nbsp;</label><span class='inspan'><div id='file_selected'></div></span></td>
		<td><input class='fw-but' id='openfilebut' type="button" value="Open"></td>
		<td><input class='fw-but' id='cancelbut' type="button" value="Cancel"></td>
	</tr></table>
  </div>
</div>
`;

let save_frame = `<div id="filewidget" class="modal">
  <div class="filewidget">
	<div class="fw-header">
	  <span class="fw-close">&times;</span>
	  <h4>Save File</h4>
	</div>
	<div class="fw-body">
			<div id="header">
			</div>
			<div class="wrapper">
			</div>
	</div>
	<div class="fw-footer">
	<table><tr>
		<td width='100%'><label class='inlab'>Save as:&nbsp;</label><span class='inspan'><input id="fw-name" class='fw-name'/></span></td>
		<td><input class='fw-but' id='savefilebut' type="button" value="Save"></td>
		<td><input class='fw-but' id='cancelbut' type="button" value="Cancel"></td>
	</tr></table>
  </div>
</div>
`;

let dir_template =`<table class='filetab' id='filetable'>
<tr>
<th class='nameh table_bts'>Name</th>
<th class='sizeh table_bts'>Size</th>
<th class='dateh table_bts'>Date</th>
</tr>
{{#unless atRootLevel}}
<tr>
<td class='table_name direntry' colspan='3'><span>..</span><a href="javascript:void(0)"/></td>
</tr>
{{/unless}}
{{#each filelist}}
{{#if isDirectory}}
<tr><td class='table_name direntry'><b>{{fname}}</b><a href="javascript:void(0)"/></td>
<td colspan='2'></td>
</tr>
{{else}}
<tr><td class='table_name fileentry'>{{fname}}<a href="javascript:void(0)"/></td>
<td class='table_dts'>{{fsize}}</td>
<td class='table_dts'>{{{formatDT this}}}</td>
</tr>
{{/if}}
{{/each}}
</table>
`;

// <td class='table_dts'>{{{formatDT this}}}</td>
let opentemp = HandleBars.compile(open_frame);
let savetemp =  HandleBars.compile(save_frame);
let dirtemp = HandleBars.compile(dir_template);

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

HandleBars.registerHelper('formatDT', (f)=>{
	let seconds = (f.ftime & 31) * 2;
	let minutes = (f.ftime >> 5) & 63;
	let hours   = (f.ftime >> 11) & 31;
	let day   = f.fdate & 31;
	let month = (f.fdate >> 5) & 15;
	let year  = ((f.fdate >> 9) & 127) + 1980;
	if (year < 2000) return "";
	return "" + month + '/' + day + '&nbsp;' + zeroPad(hours,2) + ':' + zeroPad(minutes,2);
});

import '../css/filewidget.css';

var browserActiveFlag = false;

function setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

class FileBrowser {
  constructor(params) {
  	this.params = params || {};
  	let template = params.template;
  	let initialDir = params.initialPath;

	let html = template();
	$('#popupspot').append(html);
	let widg = $('#filewidget');
	widg.css('display', 'block');
	let me = this;
	$('.fw-close', widg).click(e=> {me.cancel(e)});
	let h = Math.min(Math.max(window.innerHeight / 2, 200), 450);
	console.log(window.innerHeight + " " + h);
	$('.wrapper').css('height', h + 'px');

	this.widget = new FileWidget({template: dirtemp,
		initialDir: initialDir,
		fileSelected: (...args) => {me.fileSelect(...args)},
		dirCallback: (...args) => {me.dirSelect(...args)},
	});

	let openPlace = '/';
	if (initialDir) {
		let splits = initialDir.split('/');
		if (splits.length > 1) {
			splits.pop();
			openPlace = splits.join('/');
		}
	}
	this.widget.start(openPlace);

	browserActiveFlag = true;
	$('#cancelbut').click(e=>{me.cancel(e)});	

}

  cancel(e) {
	let widg = $('#filewidget');
	widg.css('display', 'none');
	$('#popupspot').empty();
	browserActiveFlag = false;
  }


  getSelectedFiles() {
	let selfiles = $('.file-select');
	if (selfiles && selfiles.length > 0) {
		let name = selfiles[0].firstChild.textContent;
		let fullName = this.widget.fullPathFor(name);
		console.log(fullName);
	} else {
		console.log('nobody');
	}
  }



}; // End of class

class OpenFileBrowser extends FileBrowser {
  constructor(params) {
		params = params || {};
		params.template = opentemp;
		super(params);
		let me = this;
		setDisable($('#openfilebut'), true);
		$('#openfilebut').click(e=>{me.openFile(e)});
		$('.fw-body').dblclick(e=>{me.openFile(e)});
	}

  openFile(e) {
	let cbf = this.params.opener;
	if (cbf) {
		cbf(this.selectedFile);
	}
	this.cancel();
  }
 
  fileSelect(browser, file, event, context) {
	let td = event.target.parentElement;
	$('.fileentry').removeClass('file-select');
	let fNames = file.split('/');
	let simpleName = fNames.pop();
	this.selectedFile = file;
	$('#file_selected').text(simpleName);
	$(td).addClass('file-select');
	setDisable($('#openfilebut'), false);
  }

  dirSelect(browser, path) {
	// Invalidate on directory change.
	this.selectedFile = undefined;
	$('#file_selected').empty();
	setDisable($('#openfilebut'), true);
 }

};

function openFileBrowser (params) {
	let fileBrowser = new OpenFileBrowser(params);
}

class SaveFileBrowser extends FileBrowser {
  constructor(params) {
		params = params || {};
		params.template = savetemp;
		super(params);
		let me = this;
		let initName = params.initialPath;
		if (!initName) initName = 'Sample.wav';
		$('#fw-name').val(initName);
		$('#savefilebut').click(e=>{me.saveFile(e)});
	}

  fileSelect(browser, file, event, context) {
	let td = event.target.parentElement;
	$('#fw-name').val(file);
  }

  dirSelect(browser, path) {
	let nowName = $('#fw-name').val();
	if (!nowName) return;
	let splitup = nowName.split('/');
	let namePart = 'Sample.wav';
	if (splitup.length) {
		let lastPart = splitup[splitup.length - 1];
		if (lastPart) {
			namePart = lastPart;
		}
	}
	let newVal;
	if (path === '/') {
		newVal = '/' + namePart;
	} else {
		newVal = path + '/' + namePart;
	}
	$('#fw-name').val(newVal);
  }

  saveFile(e) {
	let cbf = this.params.saver;
	let saveName = $('#fw-name').val();
	if (cbf && saveName) {
		this.widget.doesFileExist(saveName, (exists, status)=>{
			if(exists) {
				let OK = confirm("The file named " + saveName + " already exists. Overwrite?");
				if (!OK) return;
			}
			cbf(saveName);
			this.cancel();
		});
	}
  }
};

function saveFileBrowser (params) {

	let fileBrowser = new SaveFileBrowser(params);
}

function fileBrowserActive() {
	
	return browserActiveFlag;
}


export {FileBrowser, openFileBrowser, saveFileBrowser, fileBrowserActive};


