import $ from'jquery';
import {FileWidget, makeDateTime} from './FileWidget.js';
import open_frame from "./fileWidgetTemplates/open_frame.handlebars";
import save_frame from "./fileWidgetTemplates/save_frame.handlebars";
import dir_template from "./fileWidgetTemplates/dir_template.handlebars";
require('file-loader?name=[name].[ext]!../css/filewidget.css');

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

	this.browser = new FileWidget({template: dir_template,
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
	this.browser.start(openPlace);

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
		let fullName = this.browser.fullPathFor(name);
		console.log(fullName);
	} else {
		console.log('nobody');
	}
  }



}; // End of class

class OpenFileBrowser extends FileBrowser {
  constructor(params) {
		params = params || {};
		params.template = open_frame;
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
		params.template = save_frame;
		super(params);
		let me = this;
		let initName = params.initialPath;
		if (!initName) initName = '/Untitled.wav';
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
	let namePart = 'Untitled.wav';
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
		this.browser.doesFileExist(saveName, (exists, status)=>{
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


