import $ from 'jquery';
import {getActiveFS} from './FileStore.js';


function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function makeDateTime(dt) {
	if (!dt) return "";
	let seconds = dt.getSeconds();
	let minutes = dt.getMinutes();
	let hours   = dt.getHours();
	let day   = dt.getDay();
	let month = dt.getMonth();
	let year  =  dt.getYear();
	if (year < 2000) return "";
	return "" + month + '/' + day + '&nbsp;' + zeroPad(hours,2) + ':' + zeroPad(minutes,2);
}

function isDirectoryEntry(name, xlsd)
{
	let itemName = name.split('/').pop();
	for (var i = 0; i < xlsd.length; ++i) {
		let entry = xlsd[i];
		if (entry.fname === itemName) {
			if (entry.attr & 0x10) {
				 return true;
			} else return false;
		}
	}
	return false;
}

var editWhiteList = ['xml', 'js', 'htm', 'html', 'css', 'lua', 'wav'];
var editWhiteListSet = new Set(editWhiteList);

class FileWidget {

	constructor(params) {
		this.currentPath = '/';
		this.last_dirpath = "/";
		this.polling_active = false;
		this.filelist;
		this.sortOrder = 1;
		this.fieldNum = 0;
		let that = this;
		this.sortFunction = function(a, b) {
			if (!a["fname"]) return 0;
			return a["fname"].localeCompare(b["fname"]) * that.sortOrder;
		};
		if (params) {
			this.params = params;
		} else {
			this.params = {};
		}
		
		this.fs = getActiveFS();
}

  toggleChecks (e) {
	var mcv = $('#headcheck').is(':checked');
	let tlist = $('.aBox');
	$.each(tlist, function(x) {
		$(this).prop('checked', mcv);
	});

}

  setSortFunction(fieldNum) {
	if (fieldNum === this.fieldNum) {
		this.sortOrder = -this.sortOrder;
	}
	this.fieldNum = fieldNum;
	let that = this;
	switch (fieldNum) {
case 0: 
	this.sortFunction = function(a, b) {
			if (!a["fname"]) return 0;
			return a["fname"].localeCompare(b["fname"]) * that.sortOrder;
		};
		break;
case 1:
	this.sortFunction = function(a, b) {
		if( a["fdate"] == b["fdate"] ) {
			return Math.sign(a["ftime"] - b["ftime"]) * that.sortOrder;
	} 	else {
			return Math.sign(a["fdate"] - b["fdate"]) * that.sortOrder;
		}
	};
	break;
case 2:
	this.sortFunction = function(a, b) {
		return Math.sign(a["fsize"] - b["fsize"]) * that.sortOrder;
	};
	break;
	}  // End of switch
	let recheckSet = new Set(this.getCheckedList());
	this.filelist.sort(this.sortFunction);
	this.showFileList(this.currentPath, recheckSet);
}

  showFileList(path, recheckSet) {
	if(!this.params.template) {
		this.classicShowFileList(path, recheckSet);
	} else {
		this.showListUsingTemplate(path, recheckSet);
	}
  }


  showListUsingTemplate(path, recheckSet)
  {
	let template = this.params.template;
	let place = this.params.place;
	let guiCallback = this.params.guiCallback;
	let dirCallback = this.params.dirCallback;

	if (!place) place = '.wrapper';
	let context = {
		place:		place,
		filelist:	this.filelist,
		path:		path,
		recheckSet: recheckSet,
		atRootLevel: path === '/',
	}
	let html = template(context);
	$(place).empty();
	$(place).append(html);

	if (guiCallback) {
		guiCallback(this, context);
	} else {
		this.bindDefaultGUI();
	}
	if(dirCallback) {
		dirCallback(this, path, context);
	}
  }

  bindDefaultGUI() {
	this.bindListSorting();
	this.bindDirMotion();
	this.bindFileSelection();	
  }

  bindListSorting() {
	let that = this;
	$('.nameh').click(e=>{that.setSortFunction(0)});
	$('.sizeh').click(e=>{that.setSortFunction(1)});
	$('.dateh').click(e=>{that.setSortFunction(2)});
  }

  bindDirMotion() {
	let that = this;
	$('.direntry').click(e=>{
		let fn = e.target.parentElement.outerText;
		that.dir(fn);
	});
  }

  bindFileSelection() {
	let that = this;
	let fileSelCB = this.params.fileSelected;

	$('.fileentry').click(e=>{
		let fn = e.target.parentElement.outerText;
		let fullPath = that.fullPathFor(fn);
		if (fileSelCB) {
			fileSelCB(that, fullPath, e, that.params);
		}
	});
  }

  fullPathFor(name) {
  	if (this.currentPath === '/') return '/' + name;
	return this.currentPath + '/' + name;
  }

// Show file list
  classicShowFileList(path, recheckSet) {
	// Clear box.
	//$("#list").html('');
	$("#filetable tr").remove();
	let that = this;
	var row = $("<tr></tr>");
	row.append($("<td></td>").append($("<input id='headcheck' type='checkbox'></input>").addClass('tab_check')));
	row.append($("<td></td>").append($("<b>Name</b><a href='javascript:void(0)'></a>") ).addClass("table_bts nameh"));
	row.append($("<td></td>").append($("<b>Time</b><a href='javascript:void(0)'></a>")).addClass("table_bts sizeh"));
	row.append($("<td></td>").append($("<b>Size</b><a href='javascript:void(0)'></a>")).addClass("table_bts datah"));
	row.append($("<td></td>").append($("<div>Edit</div><a href='javascript:void(0)'></a>")).addClass("table_cmd"));

	$("#filetable").append(row);
	this.bindListSorting();
	$("#headcheck").on('click', ()=>{that.toggleChecks()});
	// Output a link to the parent directory if it is not the root directory.
	if( path != "/" ) {
		var row = $("<tr></tr>");
		row.append(
			$("<td colspan='2'></td>").append($("<span>..</span>")).append(
				$('<a href="javascript:void(0)"></a>').on('click', (e)=>{that.dir('..')})
			).addClass("table_name")
		);
		row.append($("<td colspan='5'></td>").append($("<b> </b><a href='javascript:void(0)'></a>")).addClass("table_bts"));
		$("#filetable").append(row);
	}
	$.each(that.filelist, function() {
		var file = this;
		// Make a link to directories and files.
		var filelink = $('<a href="javascript:void(0)"></a>');
		var filelink2 = $('<a href="javascript:void(0)"></a>');

		var caption;
		var caption2;
		var filesize;
		var dateTime;

		if ( file["attr"] & 0x10 ) {
			caption = "<b>"+file["fname"]+"</b>";
			caption2 = "Edit";
			filelink.addClass("dir").attr('href', "javascript:void(0)");
			filelink.on('click', (e)=>{that.dir(file["fname"])});
			filelink.addClass("dir");
		} else {
			var f = file["fname"].split('.');
			var ext = f[f.length-1].toLowerCase();
			filesize = file["fsize"];
			dateTime = makeDateTime(file.date);
			caption = file["fname"];

			filelink.addClass("file").attr('href', "javascript:void(0)");
			filelink.on('click', (e)=>{that.opensp(file["r_uri"] + '/' + file["fname"], false)});
			if (editWhiteListSet.has(ext)) {
				caption2 = "<font color='#FF0000'>Edit</font>";
				filelink2.addClass("file").attr('href', "javascript:void(0)");
				filelink2.on('click', (e)=>{that.openedit(file["r_uri"] + '/' + file["fname"])});
			}
		}
		// Append a file entry or directory to the end of the list.
		var row = $("<tr></tr>");
		// Be careful if you rearrange the order of items, as the checkbox is assumed to be immediately to the left of the file name item.
		let isChecked = recheckSet.has(file['fname']) ? ' checked' : '';
		let checkText = "<input class='aBox' type='checkbox'" + isChecked + "></input>";
		row.append($("<td></td>").append(checkText).addClass('tab_check'));
		row.append(
			$("<td></td>").append(caption).append(
				filelink.append()
			).addClass("table_name")
		);
		row.append(
			$("<td></td>").append(dateTime)
			.addClass("table_dts")
		);
		row.append(
			$("<td></td>").append(filesize)
			.addClass("table_dts")
		);

		row.append(
			$("<td></td>").append(caption2).append(
				filelink2.append()
			).addClass("table_cmd")
		);

		$("#filetable").append(row);
	});
}

// Be careful if you rearrange the order of items, as the following code assumes
// the checkbox to be immediately to the left of the file name item.
  getCheckedList(prepend)
{
	if(prepend === undefined) prepend = "";
	var boxList = $('.aBox:checked');
	var checkList = [];
	for (var i = 0; i < boxList.length; ++i) {
		let cb = boxList[i];
		let fnameElem =  cb.parentElement.nextSibling.firstChild;
		let ntfname = prepend + fnameElem.textContent;
		checkList.push(ntfname);
	}
	return checkList;
}

  getCheckedSet() {
	return new Set(this.getCheckedList());
}

  deleteFiles()
{
	let boxPath = this.currentPath;
	if (boxPath !== '/') boxPath += '/';
	var boxList = this.getCheckedList(boxPath);
	var alertList = boxList.join('\n');
	var result = confirm( "Delete "+ alertList + "?" );
	let that = this;
	if (result) {
		that.fs,deleteNext(boxList, this.filelist, function () {
			that.upload_after();
		});
	}
}

  rename(file)
{
	var path = window.prompt(""+file+"\nMove (or rename) this file/directory to have the following full pathname:", file);
	let that = this;
	if(path) {
		path = path.replace(/ /g , "|" ) ;
		file = file.replace(/ /g , "|" ) ;
		this.fs.rename(path, file, function (status) {
			that.upload_after();
		});
	}
}

  renameFile() {
	let boxPath = this.currentPath;
	if (boxPath !== '/') boxPath += '/';
	var boxList = this.getCheckedList(boxPath);
	if (boxList.length === 0) {
		alert("Please select a file to rename or move using the checkbox");
		return;
	}
	if (boxList.length !== 1) {
		alert("More than one file is checked. We will only rename or move the first one");
	}
	this.rename(boxList[0]);
}

  opensp(file,conf)
{
	// Open editor based on file type:
	var ext = file.split('.').pop().toLowerCase();
	if (ext === 'xml') {
		window.open("/DR/xmlView/viewXML.htm?"+file);
	} else {
		window.open(file);	
	}
}

  openedit(file)
{
	// Open editor based on file type:
	var ext = file.split('.').pop().toLowerCase();
	if (ext === 'mid') {
		window.open("/DR/midian/midian.htm?"+file);
	} else if (editWhiteListSet.has(ext)) {
		window.open("/DR/edit.htm?"+file);
	}
}

  openspx(file) {
	window.open("/DR/xmlView/viewXML.htm?"+file);
// 	window.open("/DR/xmlEd/editXML.htm?"+file);
}


//Making Path
  makePath(dir) {
	var arrPath = this.currentPath.split('/');
	if (this.currentPath == "/" ) {
		arrPath.pop();
	}
	if ( dir == ".." ) {
		// Go to parent directory. Remove last fragment.
		arrPath.pop();
	} else if ( dir != "" && dir != "." ) {
		// Go to child directory. Append dir to the current path.
		arrPath.push(dir);
	}
	if ( arrPath.length == 1 ) {
		arrPath.push("");
	}
	return arrPath.join("/");
  }

  doesFileExist(path, callback) {
  	this.fs.exists(path, callback);
  }

// Get file list
  getFileList(nextPath) { //dir

	let recheckSet = new Set();
	if (nextPath === this.currentPath) {
		recheckSet = new Set(this.getCheckedList());
	}
	let that = this;
	that.fs.dir(nextPath, function (dirList, status) {
		that.currentPath = nextPath;
		that.filelist = dirList;
		that.filelist.sort(that.sortFunction);
		that.showFileList(that.currentPath, recheckSet);
	});
}
//Document Ready
  start(where) {
	// Iniialize global variables.
	this.currentPath = where;
	this.last_dirpath = this.currentPath
	$("#header").html("<a href='"+ this.currentPath+"'>"+ this.currentPath+"</a>");
	
	this.filelist = new Array();
	// Show the root directory.
	this.getFileList(this.makePath(''));
	let that = this;

	$('#newdirbut').click(e=>{that.NewDirectory()});
	$('#deletebut').click(e=>{that.deleteFiles()});
	$('#renamebut').click(e=>{that.renameFile()});
	$('#reloadbut').click(e=>{that.reload_list()});
}

  dir(fname)
{
	var dirpath = this.makePath(fname);
	$("#header").html("<a href='"+dirpath+"'>"+dirpath+"</a>");

	var row = $("<tr></tr>");
	$("#filetable tr").remove();
	row.append(
		$("<td></td>").append($("<span>Loading...</span>")).addClass("table_name")
	);
	$("#filetable").append(row);

	this.getFileList(dirpath);
	this.last_dirpath = dirpath;
}

  reload_list()
{
	this.getFileList(this.last_dirpath);
	$("#reloadtime").html("<font color=blue>"+(new Date()).toLocaleString())+"</font>";
}


  upload(t)
{
	let that = this;
	setTimeout(()=>{that.upload_after()}, t ? t : 3000);
	return true;
}

  upload_after()
{
	this.getFileList(this.last_dirpath);
	$("#reloadtime").html("<font color=blue>"+(new Date()).toLocaleString())+"</font>";
}

  NewDirectory() {
	var path = window.prompt("Directory name?\n"+ this.last_dirpath, "NewDirectory01");
	if(path)
	{
		var url = "";
		if(this.last_dirpath != "/")
		{
			url = this.last_dirpath+"/"+path;
		}else{
			url = "/"+path;
		}
		let that = this;
		this.fs.mkdir(url, function(status) {
			alert("NewDirectory: "+data);
			that.upload_after();
		});
	}
  }


}; // End of class

export {FileWidget, makeDateTime};
