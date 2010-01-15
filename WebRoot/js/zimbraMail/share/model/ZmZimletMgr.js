/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

ZmZimletMgr = function() {
	this._ZIMLETS = [];
	this._ZIMLETS_BY_ID = {};
	this._CONTENT_ZIMLETS = [];
	this._serviceZimlets = [];
	this._requestNotHandledByAnyZimlet = [];
}

ZmZimletMgr.prototype.constructor = ZmZimletMgr;

ZmZimletMgr.prototype.toString =
function() {
	return "ZmZimletMgr";
};

//
// Constants
//

ZmZimletMgr._RE_REMOTE = /^((https?|ftps?):\x2f\x2f|\x2f)/;

//
// Public methods
//

ZmZimletMgr.prototype.isLoaded =
function() {
	return this.loaded;
};

ZmZimletMgr.prototype.loadZimlets =
function(zimletArray, userProps, target, callback, sync) {
	if(!zimletArray || !zimletArray.length) {
		this.loaded = true;
		return;
	}
	var packageCallback = callback ? new AjxCallback(this, this._loadZimlets, [zimletArray, userProps, target, callback, sync]) : null;
	AjxPackage.require({ name: "Zimlet", callback: packageCallback });
	if (!callback) {
		this._loadZimlets.apply(this, arguments);
	}
}

ZmZimletMgr.prototype._loadZimlets = function(zimletArray, userProps, target, callback, sync) {
	var z;
	var loadZimletArray = [];
	var targetRe = new RegExp("\\b"+(target || "main")+"\\b");
	for (var i=0; i < zimletArray.length; i++) {
		var zimletObj = zimletArray[i];
		var zimlet0 = zimletObj.zimlet[0];
		// NOTE: Only instantiate zimlet context for specified target
		if (!targetRe.test(zimlet0.target || "main")) continue;
		z = new ZmZimletContext(i, zimletObj);
		this._ZIMLETS_BY_ID[z.name] = z;
		this._ZIMLETS.push(z);
		loadZimletArray.push(zimletObj);
	}
	if (userProps) {
		for (i = 0; i < userProps.length; ++i) {
			var p = userProps[i];
			z = this._ZIMLETS_BY_ID[p.zimlet];
			if (z) {
				z.setPropValue(p.name, p._content);
			}
		}
	}
	var panelZimlets = this.getPanelZimlets();
 	if (panelZimlets && panelZimlets.length > 0) {
		var zimletTree = appCtxt.getZimletTree();
	 	if (!zimletTree) {
	 		zimletTree = new ZmFolderTree(ZmOrganizer.ZIMLET);
	 		appCtxt.setTree(ZmOrganizer.ZIMLET, zimletTree);
	 	}
	 	zimletTree.reset();
	 	zimletTree.loadFromJs(panelZimlets, "zimlet");
 	}

	// load zimlet code/CSS
	var zimletNames = this._getZimletNames(loadZimletArray);
	this._loadIncludes(loadZimletArray, zimletNames, (sync ? callback : null) );
	this._loadStyles(loadZimletArray, zimletNames);

	if (callback && !sync) {
		callback.run();
	}
};

ZmZimletMgr.prototype.getPanelZimlets =
function() {
	var panelZimlets = [];
	var j=0;
	for(var i=0; i < this._ZIMLETS.length; i++) {
		if(this._ZIMLETS[i].zimletPanelItem) {
			DBG.println(AjxDebug.DBG2, "Zimlets - add to panel " + this._ZIMLETS[i].name);
			panelZimlets[j++] = this._ZIMLETS[i];
		}
	}
	return panelZimlets;
};

ZmZimletMgr.prototype.getIndexedZimlets =
function() {
	var indexedZimlets = [];
	var j=0;
	for(var i=0; i < this._ZIMLETS.length; i++) {
		if(this._ZIMLETS[i].keyword) {
			DBG.println(AjxDebug.DBG2, "Zimlets - add to indexed " + this._ZIMLETS[i].name);
			indexedZimlets[j++] = this._ZIMLETS[i];
		}
	}
	return indexedZimlets;
};

ZmZimletMgr.prototype.getPortletZimlets =
function() {
	if (!this._portletArray) {
		this._portletArray = [];
		this._portletMap = {};
		for (var i = 0; i < this._ZIMLETS.length; i++) {
			var zimlet = this._ZIMLETS[i];
			if (zimlet.portlet) {
				this._portletArray.push(zimlet);
				this._portletMap[zimlet.name] = zimlet;
			}
		}
	}
	return this._portletArray;
};

ZmZimletMgr.prototype.getPortletZimletsHash =
function() {
	this.getPortletZimlets();
	return this._portletMap;
};

ZmZimletMgr.prototype.registerContentZimlet =
function(zimletObj, type, priority) {
	var i = this._CONTENT_ZIMLETS.length;
	this._CONTENT_ZIMLETS[i] = zimletObj;
	this._CONTENT_ZIMLETS[i].type = type;
	this._CONTENT_ZIMLETS[i].prio = priority;
	DBG.println(AjxDebug.DBG2, "Zimlets - registerContentZimlet(): " + this._CONTENT_ZIMLETS[i]._zimletContext.name);
};

ZmZimletMgr.prototype.getContentZimlets =
function() {
	return this._CONTENT_ZIMLETS;
};

ZmZimletMgr.prototype.getZimlets =
function() {
	return this._ZIMLETS;
};

ZmZimletMgr.prototype.getZimletsHash =
function() {
	return this._ZIMLETS_BY_ID;
};

ZmZimletMgr.prototype.zimletExists =
function(name) {
	return this._ZIMLETS_BY_ID[name];
};

ZmZimletMgr.prototype.notifyZimlets =
function(event) {
	var args = new Array(arguments.length - 1);
	for (var i = 0; i < args.length;) {
		args[i] = arguments[++i];
	}

	var a = this._ZIMLETS;
	for (var i = 0; i < a.length; ++i) {
		var z = a[i].handlerObject;
		if (z && (z instanceof ZmZimletBase) &&		// we might get here even if Zimlets were not initialized
			z.getEnabled() &&	 					// avoid calling any hooks on disabled Zimlets
		    (typeof z[event] == "function"))
		{
			z[event].apply(z, args);
		}
	}
};

/*
* Processes a request (from core-zcs to zimlets) and returns value of the
* first zimlet that serves the request.
* PS: 
* - Requestor must handle 'null' value
* - stores/caches the zimlet for a given request to improve performance.
* - also stores _requestNotHandledByAnyZimlet if no zimlet handles this
*	request(in the current session), again to improve performance.
* e.g: appCtxt.getZimletMgr().processARequest("getMailCellStyle", item, field)
*/
ZmZimletMgr.prototype.processARequest =
function(request) {

	if(this._requestNotHandledByAnyZimlet[request])
		return null;

	var args = new Array(arguments.length - 1);
	for (var i = 0; i < args.length;) {
		args[i] = arguments[++i];
	}
	var sz = this._serviceZimlets[request];
	if(sz){//if we already know a zimlet that serves this request, use it.
		return sz[request].apply(sz, args);
	}

	var a = this._ZIMLETS;
	for (var i = 0; i < a.length; ++i) {
		var z = a[i].handlerObject;
		if (z && (z instanceof ZmZimletBase) &&	z.getEnabled() &&	(typeof z[request] == "function")){
			 this._serviceZimlets[request] = z;//store 
			 return z[request].apply(z, args);
		}
	}
	if(this.isLoaded()) {//add to an array to indicate that no zimlet implements this request
		this._requestNotHandledByAnyZimlet[request]=request;
	}
	return null;
};

//
// Protected methods
//

ZmZimletMgr.prototype._getZimletNames =
function(zimletArray) {
	var array = new Array(zimletArray ? zimletArray.length : 0);
	for (var i = 0; i < zimletArray.length; i++) {
		array[i] = zimletArray[i].zimlet[0].name;
	}
	return array;
};

ZmZimletMgr.prototype._loadIncludes =
function(zimletArray, zimletNames, callback) {
	var includes = this.__getIncludes(zimletArray, zimletNames, true);
	var includesCallback = new AjxCallback(this, this._finished_loadIncludes, [zimletNames, callback]);

	AjxInclude(includes, null, includesCallback, ZmZimletBase.PROXY);
};

ZmZimletMgr.prototype._finished_loadIncludes =
function(zimletNames, callback) {
	if(!appCtxt.isChildWindow){
        this.renameZimletsLabel();
    }
    this.loaded = true;
	var zimlets = this.getZimletsHash();
	for (var i = 0; i < zimletNames.length; i++) {
		var name = zimletNames[i];
		zimlets[name]._finished_loadIncludes();
	}
	if (appCtxt.get(ZmSetting.PORTAL_ENABLED) && !appCtxt.isChildWindow) {
		var params = {
			name: "Portal",
			callback: (new AjxCallback(this, this._finished_loadIncludes2, [callback]))
		};
		DBG.println("------------------- REQUIRING Portal (ZmZimletMgr)");
		AjxPackage.require(params);
	} else {
		this._finished_loadIncludes2(callback);
	}
};

ZmZimletMgr.prototype._finished_loadIncludes2 =
function(callback) {
	appCtxt.allZimletsLoaded();
    if(callback){
        callback.run();
    }
};

ZmZimletMgr.prototype._loadStyles =
function(zimletArray, zimletNames) {
	var head = document.getElementsByTagName("head")[0];
	var includes = this.__getIncludes(zimletArray, zimletNames, false);
	for (var i = 0; i < includes.length; i++) {
		var style = document.createElement("link");
		style.type = "text/css";
		style.rel = "stylesheet";
		style.href = includes[i];

		head.appendChild(style);

		// XXX: say what?!
		style.disabled = true;
		style.disabled = false;
	}
};

//
// Private methods
//

ZmZimletMgr.prototype.__getIncludes =
function(zimletArray, zimletNames, isJS) {
	// add remote urls
	var includes = [];
	for (var i = 0; i < zimletArray.length; i++) {
		var zimlet = zimletArray[i].zimlet[0];
		var baseUrl = zimletArray[i].zimletContext[0].baseUrl;
		var isDevZimlet = baseUrl.match("/_dev/");

        var languageId = null;
        var countryId = null;
        if(appCtxt.get(ZmSetting.LOCALE_NAME)) {
            var locale = appCtxt.get(ZmSetting.LOCALE_NAME);
            var index = locale.indexOf("_");
            if (index == -1) {
                languageId = locale;
                } else {
                languageId = locale.substr(0, index);
                countryId = locale.substr(index+1);
            }
        }        
		// add cache killer to each url
		var query = isDevZimlet
			? ("?debug=1&v="+new Date().getTime())
			: ("?v="+cacheKillerVersion+"&");
        query += ((languageId ? "language=" + languageId : "")+"&");
        query += ((countryId ? "country=" + countryId : ""));

		// include messages
		if (appDevMode && isJS) {
			includes.push([appContextPath, "/res/", zimlet.name, ".js", query].join(""));
		}

		// include links
		var links = (isJS ? zimlet.include : zimlet.includeCSS) || [];
		for (var j = 0; j < links.length; j++) {
			var url = links[j]._content;
			if (ZmZimletMgr._RE_REMOTE.test(url)) {
				var fullurl = [ ZmZimletBase.PROXY, AjxStringUtil.urlComponentEncode(url) ].join("");
				includes.push(fullurl);
				continue;
			}
			if (appDevMode || isDevZimlet) {
				includes.push([baseUrl, url, query].join(""));
			}
		}
	}

	// add link to aggregated files
	if (!appDevMode) {
        var extension = (!AjxEnv.isIE || (!AjxEnv.isIE6 && AjxEnv.isIE6up)) ? appExtension : "";
		includes.unshift([
			"/service/zimlet/res/Zimlets-nodev_all",
			(isJS ? (".js" + extension) : ".css")+"?",
            (languageId ? "language=" + languageId : "")+"&",
            (countryId ? "country=" + countryId : "")    
        ].join(""));
	}

	return includes;
};

ZmZimletMgr.prototype.renameZimletsLabel =
function()
{
    var treeView = appCtxt.getOverviewController().getTreeController("ZIMLET").getTreeView("Mail");
	if(treeView){
        var root = treeView.getItems()[0];
	    if (root) {
            var items = root.getItems();
            for (var i = 0; i < items.length; i++) {
                this.changeZimletLabel(items[i]);
            }
	    }
    }
};

ZmZimletMgr.prototype.changeZimletLabel =
function(item)
{
    var zimlet = item.getData(Dwt.KEY_OBJECT);
    if(zimlet){
        var currentLabel = zimlet.getName();
        var regEx = /\$/;
        if(currentLabel.match(regEx))
        {
            var replaceLabel = currentLabel.replace(/\${msg./,'').replace(/}/,'');
            var zimletContextName = zimlet.getZimletContext().name;
            if(window[zimletContextName]){
            var str = window[zimletContextName][replaceLabel];
                if(str){
                    item.setText(str);
                    zimlet.setName(str);
                }
            }
        }
    }
};