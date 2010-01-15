/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2008, 2009, 2010 Zimbra, Inc.
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

ZmImportView = function(params) {
	if (arguments.length == 0) { return; }
	ZmImportExportBaseView.call(this, params);

	this._exportListener = new AjxListener(this, this._handleExport);
	this._folderListener = new AjxListener(this, this._handleFolder);
	this._resolveListener = new AjxListener(this, this._handleResolve);

	// TODO
};
ZmImportView.prototype = new ZmImportExportBaseView;
ZmImportView.prototype.constructor = ZmImportView;

ZmImportView.prototype.toString = function() {
	return "ZmImportView";
};

//
// Constants
//

ZmImportView.prototype.TYPE_HINTS = {};
ZmImportView.prototype.TYPE_HINTS[ZmImportExportController.TYPE_CSV] = ZmMsg.importFromCSVHint;
ZmImportView.prototype.TYPE_HINTS[ZmImportExportController.TYPE_ICS] = ZmMsg.importFromICSHint;
ZmImportView.prototype.TYPE_HINTS[ZmImportExportController.TYPE_TGZ] = ZmMsg.importFromTGZHint;

//
// Data
//

ZmImportView.prototype.TEMPLATE = "data.ImportExport#ImportView";

//
// Public methods
//

/**
 * Returns a params object that can be used to directly call
 * ZmImportExportController#exportData.
 */
ZmImportView.prototype.getParams = function() {
	var type = this.getFormValue("TYPE", ZmImportExportController.TYPE_TGZ);
	var isTGZ = type == ZmImportExportController.TYPE_TGZ;
	var folderId = this.getFormValue("FOLDER","all") != "all" ? this._folderId : null; 
	var params = {
		// required
		form:		this.getFormObject("FILE").form,
		// optional -- ignore if not relevant
		type:		this.isRelevant("TYPE") ? type : null,
		subType:	this.isRelevant("SUBTYPE") ? this.getFormValue("SUBTYPE") : null,
		views:		this.isRelevant("DATA_TYPES") ? this.getFormValue("DATA_TYPES") : null,
		resolve:	this.isRelevant("RESOLVE") && isTGZ ? this.getFormValue("RESOLVE", "ignore") : null,
		folderId:	this._folderId,
		dataTypes:	this.isRelevant("DATA_TYPES") ? this.getFormValue("DATA_TYPES") : null
	};
	return params;
};

//
// Protected methods
//

ZmImportView.prototype._registerControls = function() {
	ZmImportExportBaseView.prototype._registerControls.apply(this, arguments);
	this._registerControl("FILE", {
		displayContainer:	ZmPref.TYPE_CUSTOM
	});
	this._registerControl("RESOLVE", {
		displayContainer:	ZmPref.TYPE_RADIO_GROUP,
		orientation:        ZmPref.ORIENT_HORIZONTAL,
		displayOptions:		[ZmMsg.resolveDuplicateIgnore, ZmMsg.resolveDuplicateReplace, ZmMsg.resolveDuplicateReset],
		// NOTE: Ignore value should not be sent to server, so we leave blank.
		options:			["", "replace", "reset"]
	});
};

ZmImportView.prototype._setupCustom = function(id, setup, value) {
	if (id == "FILE") {
		var fileEl = document.getElementById([this._htmlElId,id].join("_"));
		fileEl.name = "file";
		this.setFormObject(id, fileEl);
	}
	return ZmImportExportBaseView.prototype._setupCustom.apply(this, arguments);
};

ZmImportView.prototype._getSubTypeOptions = function(type) {
	var setup = this.SETUP["SUBTYPE"];
	if (!setup.options) {
		setup.options = ZmPref.SETUP["IMPORT_FOLDER"].options || [];
		setup.displayOptions = ZmPref.SETUP["IMPORT_FOLDER"].displayOptions || [];
		if (setup.options.length > 0) {
			setup.options.unshift("");
			setup.displayOptions.unshift(ZmMsg.importAutoDetect);
		}
	}
	return ZmImportExportBaseView.prototype._getSubTypeOptions.apply(this, arguments);
};

ZmImportView.prototype._updateControls = function() {
	var type = this.getFormValue("TYPE", ZmImportExportController.TYPE_TGZ);
	var isZimbra = type == ZmImportExportController.TYPE_TGZ;

	ZmImportExportBaseView.prototype._updateControls.apply(this, arguments);
	this.setControlVisible("RESOLVE", isZimbra);
};
