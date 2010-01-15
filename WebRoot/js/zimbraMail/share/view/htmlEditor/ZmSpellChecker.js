/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2010 Zimbra, Inc.
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

/**
 * Makes server request to check spelling of given text.
 * @constructor
 * @class
 * Use this class to check spelling of any text via check() method.
 *
 * TODO: we may want to move this class out into its own file later...
 *
 * @author Mihai Bazon
 * 
 * @param parent		the parent needing spell checking
 */
ZmSpellChecker = function(parent) {
	this._parent = parent;
};


// Public methods
ZmSpellChecker.prototype.toString =
function() {
	return "ZmSpellChecker";
};

ZmSpellChecker.prototype.check =
function(text, callback) {
	var soapDoc = AjxSoapDoc.create("CheckSpellingRequest", "urn:zimbraMail");
	soapDoc.getMethod().appendChild(soapDoc.getDoc().createTextNode(text));

	var callback = new AjxCallback(this, this._checkCallback, callback);
	appCtxt.getAppController().sendRequest({soapDoc: soapDoc, asyncMode: true, callback: callback});
};

ZmSpellChecker.prototype._checkCallback =
function(callback, result) {
	var words = result._isException ? null : result.getResponse().CheckSpellingResponse;

	if (callback)
		callback.run(words);
};
