browser.storage.onChanged.addListener(function (changes, areaName) {
	for (key in changes) {
		var storageChange = changes[key];
		if(key == "defaultFolder") {
			localStorage.defaultFolder = storageChange.newValue;
		}else {
			localStorage.rules = storageChange.newValue;
		}
	}
});

browser.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){

		browser.storage.sync.get('defaultFolder', function (items) {
			if(typeof items.defaultFolder == 'undefined') {
				localStorage.defaultFolder = "default";
				browser.storage.sync.set({'defaultFolder': "default" });

			}else {
				localStorage.defaultFolder = items.defaultFolder;
			}
		});
		browser.storage.sync.get('rules', function (items) {
			if(typeof items.rules == 'undefined') {
				localStorage.rules = JSON.stringify([{"extension":"jpg,jpeg,gif,png","foldername":"images"},{"extension":"zip,z7,tar,gz","foldername":"compression"},{"extension":"exe","foldername":"exe"},{"extension":"pdf,hwp,doc,docx","foldername":"document"},{"extension":"z*","foldername":"z_start_all_file"}]);
				browser.storage.sync.set({'rules': JSON.stringify([{"extension":"jpg,jpeg,gif,png","foldername":"images"},{"extension":"zip,z7,tar,gz","foldername":"compression"},{"extension":"exe","foldername":"exe"},{"extension":"pdf,hwp,doc,docx","foldername":"document"},{"extension":"z*","foldername":"z_start_all_file"}]) });
			}else {
				localStorage.rules = items.rules;
			}
			browser.tabs.create({url: "/dowload-sorter.html"});
		});

    }else if(details.reason == "update"){

		browser.storage.sync.get('defaultFolder', function (items) {
			if(typeof items.defaultFolder == 'undefined') {
				browser.storage.sync.set({'defaultFolder': localStorage.defaultFolder});
			}else {
				localStorage.defaultFolder = items.defaultFolder;
			}
		});
		browser.storage.sync.get('rules', function (items) {
			if(typeof items.rules == 'undefined') {
				browser.storage.sync.set({'rules': localStorage.rules});
			}else {
				localStorage.rules = items.rules;
			}
			browser.tabs.create({url: "/dowload-sorter.html"});
		});
    }
});

function matches(extension, filename) {
	if(extension == ""){
		return false;
	}
	
	index = -1;
	index = filename.lastIndexOf('.');
	
	if(index != -1){
		type = filename.substring(index+1, filename.len);
	}

	extensionLower = extension.toLowerCase();
	extensionLower = extensionLower.replace(/ /gi, '');

	if(extensionLower.indexOf("*") != -1 || extensionLower.indexOf("|") != -1 || extensionLower.indexOf(",") != -1) {

		extensionLower = extensionLower.replace(/,/gi, '|');

		extensionSplit = extensionLower.split('|');

		temp = "";
		index = 0;
		extensionSplit.forEach(function(element) {
			if(index != 0)
				temp += "|^" + element + "$";
			else
				temp += "^" + element + "$";
			index++;
		});

		extensionLower = temp;

		extensionLower = extensionLower.replace(/\*/gi, "[a-z0-9]*");

		var pattern = new RegExp(extensionLower);

		if(pattern.test(type.toLowerCase())) {
			return true;
		}
	}

	if(type.toLowerCase() == extensionLower) {
		return true;
	}
	
	return false;
}

browser.contextMenus.create({
    id: "save-file",
    title: "Save file to location",
    contexts: ["all"],
});
browser.contextMenus.onClicked.addListener((info, tab) => {
if (info.menuItemId === "save-file") {
	
	var safeUrl = escapeHTML(info.linkUrl);

	if (safeUrl === 'undefined') {
		safeUrl = escapeHTML(info.srcUrl);
	}
	var localFilename = safeUrl.replace(/^.*[\\\/]/, '');

	function suggest(filename, foldername) {		
			
			item = browser.downloads.download({'filename':foldername + "/" + filename, 'saveAs' : true, 'url':safeUrl})
		}	

	var rules = localStorage.rules;

	try {
		rules = JSON.parse(rules);
	} catch (e) {
		localStorage.rules = JSON.stringify([]);
	}

	var found = false;
	for ( var index = 0; index < rules.length; ++index) {
		var rule = rules[index];
		if (matches(rule.extension,localFilename)) {
			suggest(localFilename, rule.foldername);
			found = true;
			break;
		}
	}
	
	
	if(!found){
		suggest(localFilename, localStorage.defaultFolder);
	}
}
});

// https://gist.github.com/Rob--W/ec23b9d6db9e56b7e4563f1544e0d546
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}