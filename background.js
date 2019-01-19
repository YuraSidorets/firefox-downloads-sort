const DEFAULT_FOLDER = "defaultFolder";
const TAB_URL = "/dowload-sorter.html";

browser.storage.onChanged.addListener((changes) => {
    for (key in changes) {
        var storageChange = changes[key];
        if (key == DEFAULT_FOLDER) {
            localStorage.defaultFolder = storageChange.newValue;
        } else {
            localStorage.rules = storageChange.newValue;
        }
    }
});

browser.runtime.onInstalled.addListener((details) => {
    if (details.reason == "install") {
        browser.storage.sync.get(DEFAULT_FOLDER, (items) => {
            if (typeof items.defaultFolder == 'undefined') {
                localStorage.defaultFolder = "default";
                browser.storage.sync.set({
                    DEFAULT_FOLDER: "default"
                });
            } else {
                localStorage.defaultFolder = items.defaultFolder;
            }
        });

        browser.storage.sync.get('rules', (items) => {
            if (typeof items.rules == 'undefined') {
                localStorage.rules = JSON.stringify([{
                    "extension": "jpg,jpeg,gif,png",
                    "foldername": "images"
                }, {
                    "extension": "zip,z7,tar,gz",
                    "foldername": "compression"
                }, {
                    "extension": "exe",
                    "foldername": "exe"
                }, {
                    "extension": "pdf,hwp,doc,docx",
                    "foldername": "document"
                }, {
                    "extension": "z*",
                    "foldername": "z_start_all_file"
                }]);
                browser.storage.sync.set({
                    'rules': JSON.stringify([{
                        "extension": "jpg,jpeg,gif,png",
                        "foldername": "images"
                    }, {
                        "extension": "zip,z7,tar,gz",
                        "foldername": "compression"
                    }, {
                        "extension": "exe",
                        "foldername": "exe"
                    }, {
                        "extension": "pdf,hwp,doc,docx",
                        "foldername": "document"
                    }, {
                        "extension": "z*",
                        "foldername": "z_start_all_file"
                    }])
                });
            } else {
                localStorage.rules = items.rules;
            }
            browser.tabs.create({
                url: TAB_URL
            });
        });

    } else if (details.reason == "update") {
        browser.storage.sync.get(DEFAULT_FOLDER, (items) => {
            if (typeof items.defaultFolder == 'undefined') {
                browser.storage.sync.set({
                    DEFAULT_FOLDER: localStorage.defaultFolder
                });
            } else {
                localStorage.defaultFolder = items.defaultFolder;
            }
        });

        browser.storage.sync.get('rules', (items) => {
            if (typeof items.rules == 'undefined') {
                browser.storage.sync.set({
                    'rules': localStorage.rules
                });
            } else {
                localStorage.rules = items.rules;
            }
            browser.tabs.create({
                url: TAB_URL
            });
        });
    }
});

function matches(extension, filename) {
    if (extension == "") {
        return false;
    }

    index = -1;
    index = filename.lastIndexOf('.');

    if (index != -1) {
        type = filename.substring(index + 1, filename.len);
    }

    extensionLower = extension.toLowerCase();
    extensionLower = extensionLower.replace(/ /gi, '');

    if (extensionLower.indexOf("*") != -1 ||
        extensionLower.indexOf("|") != -1 ||
        extensionLower.indexOf(",") != -1) {

        extensionLower = extensionLower.replace(/,/gi, '|');
        extensionSplit = extensionLower.split('|');

        temp = "";
        index = 0;
        extensionSplit.forEach((element) => {
            if (index != 0)
                temp += "|^" + element + "$";
            else
                temp += "^" + element + "$";
            index++;
        });

        extensionLower = temp;
        extensionLower = extensionLower.replace(/\*/gi, "[a-z0-9]*");

        var pattern = new RegExp(extensionLower);
        if (pattern.test(type.toLowerCase())) {
            return true;
        }
    }

    if (type.toLowerCase() == extensionLower) {
        return true;
    }

    return false;
}

const CONTEXT_ID = "save-file";
browser.contextMenus.create({
    id: CONTEXT_ID,
    title: "Save file to location",
    contexts: ["all"],
});

browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId == CONTEXT_ID) {
        function suggestDownload(filename, foldername) {
            browser.downloads.download({
                'filename': foldername + "/" + filename,
                'saveAs': true,
                'url': safeUrl
            })
        }

        var safeUrl = "";
        if (info.linkUrl != 'undefined') {
            safeUrl = escapeHTML(info.linkUrl);
        } else {
            safeUrl = escapeHTML(info.srcUrl);
        }

        var rules = localStorage.rules;
        try {
            rules = JSON.parse(rules);
        } catch (e) {
            localStorage.rules = JSON.stringify([]);
        }

        var localFilename = safeUrl.replace(/^.*[\\\/]/, '');
        var found = false;
        for (var index = 0; index < rules.length; ++index) {
            var rule = rules[index];
            if (matches(rule.extension, localFilename)) {
                suggestDownload(localFilename, rule.foldername);
                found = true;
                break;
            }
        }

        if (!found) {
            suggestDownload(localFilename, localStorage.defaultFolder);
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