/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2008, 2010 Zimbra, Inc.
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
 
ZmChatMemberListView = function(parent, rosterList) {
	DwtListView.call(this, {parent:parent, className:"ZmChatMemberList", posStyle:DwtControl.ABSOLUTE_STYLE,
							headerList:this._getHeaderList()});
	this.type = ZmItem.ROSTER_ITEM;
	this.rosterList = rosterList;
	this.rosterList.addChangeListener(new AjxListener(this, this._rosterListChangeListener));
	this._view = ZmId.VIEW_IM_CHAT_MEMBER_LIST;
    this.set(rosterList.getVector().clone());
};

ZmChatMemberListView.prototype = new DwtListView;
ZmChatMemberListView.prototype.constructor = ZmChatMemberListView;

ZmChatMemberListView.ID_SHOW_ICON = "i--";
ZmChatMemberListView.ID_NAME = "n--";

ZmChatMemberListView.prototype.toString = 
function() {
	return "ZmChatMemberListView";
};

ZmChatMemberListView.prototype.setSize =
function(width, height) {
	DwtListView.prototype.setSize.call(this, width, height);
	this._sizeChildren(width, height);
};

ZmChatMemberListView.prototype.setBounds =
function(x, y, width, height) {
	DwtListView.prototype.setBounds.call(this, x, y, width, height);
	this._sizeChildren(width, height);
};

ZmChatMemberListView.prototype._sizeChildren =
function(width, height) {
	if (this._listDiv) {
		Dwt.setSize(this._listDiv, Dwt.DEFAULT, this.getHtmlElement().clientHeight - DwtListView.HEADERITEM_HEIGHT);
		this._listDiv.style.overflow = 'auto';
	}
};

ZmChatMemberListView.prototype._getFieldId =
function(item, id) {
	return DwtId.getListViewItemId(DwtId.WIDGET_ITEM_FIELD, this._view, item.id, id);
};

ZmChatMemberListView.prototype._setNoResultsHtml = 
function() {
	// ignore if target list view
//	if (this._initialized && !this._extHeader)
//		DwtListView.prototype._setNoResultsHtml.call(this);
};

// The items are ZmRosterItem objects
ZmChatMemberListView.prototype._createItemHtml =
function(item) {

	var div = document.createElement("div");
	div[DwtListView._STYLE_CLASS] = "Row";
	div[DwtListView._SELECTED_STYLE_CLASS] = div[DwtListView._STYLE_CLASS] + '-' + DwtCssStyle.SELECTED;
	div.className = div[DwtListView._STYLE_CLASS];
			
	var html = new AjxBuffer();

	html.append("<table cellpadding=0 cellspacing=0 border=0 width=100%><tr>");
    html.append("<td width=20 id='", this._getFieldId(item, ZmChatMemberListView.ID_SHOW_ICON),"'>", AjxImg.getImageHtml(item.getPresence().getIcon()), "</td>");
	html.append("<td id='",this._getFieldId(item, ZmChatMemberListView.ID_NAME),"'>&nbsp;", AjxStringUtil.htmlEncode(item.getDisplayName()), "</td>");
	html.append("</tr></table>");
	div.innerHTML = html.toString();
	this.associateItemWithElement(item, div, DwtListView.TYPE_LIST_ITEM);
	return div;
};

ZmChatMemberListView.prototype._getHeaderList = 
function() {
    return null;
	var headerList = new Array();
    headerList.push(new DwtListHeaderItem({field:ZmChatMemberListView.ID_SHOW_ICON, icon:"ImStartChat", width:20}));
	headerList.push(new DwtListHeaderItem({field:ZmChatMemberListView.ID_NAME, text:ZmMsg.buddy}));
	return headerList;
};

ZmChatMemberListView.prototype._itemClicked = 
function(clickedEl, ev) {

	// dont allow right clicks since it doesnt make sense here...
	if (!ev.shiftKey && !ev.ctrlKey && ev.button == DwtMouseEvent.RIGHT) {
		return;
	} else {
		DwtListView.prototype._itemClicked.call(this, clickedEl, ev);
	}
};

// NOTE: this is adapted from ZmListView but we no longer derive from it
ZmChatMemberListView.prototype._setListEvent =
function (ev, listEv, clickedEl) {

	DwtListView.prototype._setListEvent.call(this, ev, listEv, clickedEl);

	var id = (ev.target.id && ev.target.id.indexOf("AjxImg") == -1) ? ev.target.id : clickedEl.id;
	if (!id) return false;

	if (ev.button == DwtMouseEvent.LEFT) {
		var m = this._parseId(id);
		listEv.field = m ? m.field : null;
	}
	return true;
};

// NOTE: this is taken from ZmListView but we no longer derive from it
ZmChatMemberListView.prototype._parseId =
function(id) {
	return ZmListView.prototype._parseId.apply(this, arguments);
};

ZmChatMemberListView.prototype._sortColumn = 
function(columnItem, bSortAsc) {
//	var sortBy = bSortAsc ? ZmSearch.NAME_ASC : ZmSearch.NAME_DESC;
//	this.parent.search(sortBy);
};

ZmChatMemberListView.prototype._rosterListChangeListener = 
function(ev) {
    var items= ev.getItems();
    for (var n=0; n < items.length; n++) {
        var item = items[n];
        if (!(item instanceof ZmRosterItem)) continue;
        switch(ev.event) {
        //case ZmEvent.E_MODIFY: modifies are forwarded from ZmChatWindow._rosterItemChangeListener
        case ZmEvent.E_CREATE:
            this.addItem(item);
            break;
        }
   }
};

ZmChatMemberListView.prototype._rosterItemChangeListener =
function(item, fields) {
    var doPresence = (ZmRosterItem.F_PRESENCE in fields);
    var doUnread = (ZmRosterItem.F_UNREAD in fields);
    var doName = (ZmRosterItem.F_NAME in fields);

    if (doPresence)  {
        var el = document.getElementById(this._getFieldId(item, ZmChatMemberListView.ID_SHOW_ICON));
        if (el) el.innerHTML = AjxImg.getImageHtml(item.getPresence().getIcon());
    }
    if (doName) {
        var el = document.getElementById(this._getFieldId(item, ZmChatMemberListView.ID_NAME));
        if (el) el.innerHTML = AjxStringUtil.htmlEncode(item.getDisplayName());
    }
};
