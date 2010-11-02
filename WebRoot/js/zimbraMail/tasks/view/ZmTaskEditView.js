/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
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
 * @overview
 * This file contains the edit task view classes.
 */

/**
 * Creates the edit task view.
 * @class
 * This class represents the edit task view.
 * 
 * @param	{DwtComposite}	parent		the parent
 * @param	{ZmTaskController}		controller		the controller
 * 
 * @extends		ZmCalItemEditView
 */
ZmTaskEditView = function(parent, controller) {
	ZmCalItemEditView.call(this, parent, null, controller, null, DwtControl.ABSOLUTE_STYLE);
};

ZmTaskEditView.prototype = new ZmCalItemEditView;
ZmTaskEditView.prototype.constructor = ZmTaskEditView;


// Consts

/**
 * Defines the priority values.
 * 
 * @see		ZmCalItem
 */
ZmTaskEditView.PRIORITY_VALUES = [
	ZmCalItem.PRIORITY_LOW,
	ZmCalItem.PRIORITY_NORMAL,
	ZmCalItem.PRIORITY_HIGH ];

/**
 * Defines the status values.
 * 
 * @see		ZmCalendarApp
 */
ZmTaskEditView.STATUS_VALUES = [
	ZmCalendarApp.STATUS_NEED,
	ZmCalendarApp.STATUS_COMP,
	ZmCalendarApp.STATUS_INPR,
	ZmCalendarApp.STATUS_WAIT,
	ZmCalendarApp.STATUS_DEFR ];

// Message dialog placement
ZmTaskEditView.DIALOG_X = 50;
ZmTaskEditView.DIALOG_Y = 100;


// Public Methods

/**
 * Returns a string representation of the object.
 * 
 * @return		{String}		a string representation of the object
 */
ZmTaskEditView.prototype.toString =
function() {
	return "ZmTaskEditView";
};

/**
 * @private
 */
ZmTaskEditView.prototype.set =
function(calItem, mode, isDirty) {
	this.initialize(calItem, mode, isDirty);

	// HACK: TEV takes too long to init so design mode never gets set properly
	if (AjxEnv.isGeckoBased) {
		var ta = new AjxTimedAction(this, this.reEnableDesignMode);
		AjxTimedAction.scheduleAction(ta, 500);
	}
};

/**
 * Gets the controller.
 * 
 * @return	{ZmTaskController}		the controller
 */
ZmTaskEditView.prototype.getController =
function() {
	return this._controller;
};

ZmTaskEditView.prototype._getClone =
function() {
	return ZmTask.quickClone(this._calItem);
};

ZmTaskEditView.prototype._populateForEdit =
function(calItem, mode) {
	ZmCalItemEditView.prototype._populateForEdit.call(this, calItem, mode);

	if (calItem.startDate) {
		var sd = new Date(calItem.startDate.getTime());
		this._startDateField.value = AjxDateUtil.simpleComputeDateStr(sd);
	}
	if (calItem.endDate) {
		var ed = new Date(calItem.endDate.getTime());
		this._endDateField.value = AjxDateUtil.simpleComputeDateStr(ed);
	}


    var rd = new Date(calItem.remindDate.getTime());

    if (calItem.alarm) {
        if (calItem.remindDate && calItem._reminderAbs) {
            this._remindTimeSelect.set(calItem.remindDate);
        }
    } else {
        var now = AjxDateUtil.roundTimeMins(new Date(), 30);
        this._remindTimeSelect.set(now);        
    }

    if (this._hasReminderSupport) {
        this._remindDateField.value = AjxDateUtil.simpleComputeDateStr(rd);
        this._reminderCheckbox.setSelected(calItem.alarm);
        this._setRemindersEnabled(calItem.alarm);

        if (calItem.alarmActions.contains(ZmCalItem.ALARM_EMAIL)) {
            this._reminderEmailCheckbox.setSelected(true);
        }
        if (calItem.alarmActions.contains(ZmCalItem.ALARM_DEVICE_EMAIL)) {
            this._reminderDeviceEmailCheckbox.setSelected(true);
        }

        this._setEmailReminderControls();
    }

	this._location.setValue(calItem.getLocation());
	this._prioritySelect.setSelectedValue(calItem.priority);
	this._statusSelect.setSelectedValue(calItem.status);
	this._pCompleteSelect.setSelectedValue(calItem.pComplete);
	this._statusCheckbox.checked = calItem.status == ZmCalendarApp.STATUS_COMP && calItem.pComplete == 100;
};

ZmTaskEditView.prototype._populateForSave =
function(calItem) {
	ZmCalItemEditView.prototype._populateForSave.call(this, calItem);

	calItem.location = this._location.getValue();
	// TODO - normalize
	var startDate = AjxDateUtil.simpleParseDateStr(this._startDateField.value);
	var endDate = AjxDateUtil.simpleParseDateStr(this._endDateField.value);

	if (startDate) {
		calItem.setStartDate(startDate, true);
	} else {
		calItem.startDate = null;	// explicitly null out in case item has old data
	}

	if (endDate) {
		calItem.setEndDate(endDate, true);
	} else {
		calItem.endDate = null;		// explicitly null out in case item has old data
	}

    //set reminder
    if (this._hasReminderSupport && this._reminderCheckbox.isSelected()) {
        var remindDate = AjxDateUtil.simpleParseDateStr(this._remindDateField.value);
        calItem.alarm = true;
        calItem.remindDate = remindDate;
        remindDate = this._remindTimeSelect.getValue(remindDate);
        var remindFmtStr = AjxDateUtil.getServerDateTime(remindDate,true);
        calItem.setTaskReminder(remindFmtStr);
        var reminders = [
            { control: this._reminderEmailCheckbox,       action: ZmCalItem.ALARM_EMAIL        },
            { control: this._reminderDeviceEmailCheckbox, action: ZmCalItem.ALARM_DEVICE_EMAIL }
        ];
        for (var i = 0; i < reminders.length; i++) {
            var reminder = reminders[i];
            if (reminder.control && reminder.control.isSelected()) {
                calItem.addReminderAction(reminder.action);
            }
            else {
                calItem.removeReminderAction(reminder.action);
            }
        }
    } else {
       calItem.alarm = false;
       calItem.remindDate = new Date();
       calItem.setTaskReminder(null);
    }
    
	calItem.setAllDayEvent(true);
	calItem.pComplete = this._pCompleteSelect.getValue();
	calItem.priority = this._prioritySelect.getValue();
	calItem.status = this._statusSelect.getValue();

//	XXX: uncomment when supported
//	this._getRecurrence(calItem);	// set any recurrence rules LAST

	return calItem;
};

ZmTaskEditView.prototype.isValid =
function() {
	var errorMsg;
	var subj = AjxStringUtil.trim(this._subjectField.getValue());

	if (subj && subj.length) {
		var endDate = this._endDateField.value;
		if (endDate.length > 0 &&
			(!ZmTimeSelect.validStartEnd(this._startDateField, this._endDateField)))
		{
			errorMsg = ZmMsg.errorInvalidDates;
		}
    } else {
		errorMsg = ZmMsg.errorMissingSubject;
	}

	if (errorMsg) {
		throw errorMsg;
	}

	return true;
};

ZmTaskEditView.prototype.cleanup =
function() {
	ZmCalItemEditView.prototype.cleanup.call(this);

	this._startDateField.value = "";
	this._endDateField.value = "";
};


// Private/protected Methods

ZmTaskEditView.prototype._createHTML =
function() {
	this._statusCheckboxId 	= this._htmlElId + "_status_cbox";

	//this._repeatDescId		= this._htmlElId + "_repeatDesc";
    this._isAppt = false;
	var subs = {
		id: this._htmlElId,
		height: (this.parent.getSize().y - 30),
		locationId: (this._htmlElId + "_location"),
		isGalEnabled: appCtxt.get(ZmSetting.GAL_ENABLED),
		isAppt: false
	};

	// XXX: rename template name to CalItem#CalItemEdit
	this.getHtmlElement().innerHTML = AjxTemplate.expand("calendar.Appointment#EditView", subs);
};

ZmTaskEditView.prototype._createWidgets =
function(width) {
	ZmCalItemEditView.prototype._createWidgets.call(this, width);

	// add location
	var params = {parent: this, type: DwtInputField.STRING};
	this._location = new DwtInputField(params);
	Dwt.setSize(this._location.getInputElement(), width, "22px");
	this._location.reparentHtmlElement(this._htmlElId + "_location");

	// add priority DwtSelect
	this._prioritySelect = new DwtSelect({parent:this});
	for (var i = 0; i < ZmTaskEditView.PRIORITY_VALUES.length; i++) {
		var v = ZmTaskEditView.PRIORITY_VALUES[i];
		this._prioritySelect.addOption(ZmCalItem.getLabelForPriority(v), i==1, v);
	}
	this._prioritySelect.reparentHtmlElement(this._htmlElId + "_priority");

	var listener = new AjxListener(this, this._selectListener);
	// add status DwtSelect
	this._statusSelect = new DwtSelect({parent:this});
	for (var i = 0; i < ZmTaskEditView.STATUS_VALUES.length; i++) {
		var v = ZmTaskEditView.STATUS_VALUES[i];
		this._statusSelect.addOption(ZmCalItem.getLabelForStatus(v), i==0, v);
	}
	this._statusSelect.addChangeListener(listener);
	this._statusSelect.reparentHtmlElement(this._htmlElId + "_status");

	// add percent complete DwtSelect
	this._pCompleteSelect = new DwtSelect({parent:this});
    var formatter = new AjxMessageFormat(AjxMsg.percentageString);
	for (var i = 0; i <= 100; i += ZmTask.PCOMPLETE_INT) {
		this._pCompleteSelect.addOption((formatter.format(i)), i==0, i);
	}
	this._pCompleteSelect.addChangeListener(listener);
	this._pCompleteSelect.reparentHtmlElement(this._htmlElId + "_complete");

    this._hasReminderSupport = Dwt.byId(this._htmlElId + "_reminderCheckbox") != null;

    if (this._hasReminderSupport) {
        // reminder date DwtButton's
        var remindDateBtnListener = new AjxListener(this, this._remindDateBtnListener);
        var remindDateCalSelectionListener = new AjxListener(this, this._dateCalSelectionListener);

        this._reminderCheckbox = new DwtCheckbox({parent:this});
        this._reminderCheckbox.replaceElement(this._htmlElId+"_reminderCheckbox");
        this._reminderCheckbox.addSelectionListener(new AjxListener(this, this._setEmailReminderControls));

        this._remindDateField = document.getElementById(this._htmlElId + "_remindDateField");
        this._remindDateButton = ZmCalendarApp.createMiniCalButton(this, this._htmlElId + "_remindMiniCalBtn", remindDateBtnListener, remindDateCalSelectionListener);
        this._remindDateButton.reparentHtmlElement(this._htmlElId + "_remindMiniCalBtn");

        // time ZmTimeSelect
        this._remindTimeSelect = new ZmTimeInput(this, ZmTimeInput.START);
        this._remindTimeSelect.reparentHtmlElement(this._htmlElId + "_remindTimeSelect");

        this._reminderEmailCheckbox = new DwtCheckbox({parent: this});
        this._reminderEmailCheckbox.replaceElement(document.getElementById(this._htmlElId + "_reminderEmailCheckbox"));
        this._reminderEmailCheckbox.setText(ZmMsg.email);
        this._reminderDeviceEmailCheckbox = new DwtCheckbox({parent: this});
        this._reminderDeviceEmailCheckbox.replaceElement(document.getElementById(this._htmlElId + "_reminderDeviceEmailCheckbox"));
        this._reminderDeviceEmailCheckbox.setText(ZmMsg.deviceEmail);
        this._reminderConfigure = new DwtText({parent:this,className:"FakeAnchor"});
        this._reminderConfigure.setText(ZmMsg.remindersConfigure);
        this._reminderConfigure.getHtmlElement().onclick = AjxCallback.simpleClosure(this._handleConfigureClick, this);
        this._reminderConfigure.replaceElement(document.getElementById(this._htmlElId+"_reminderConfigure"));
        this._setEmailReminderControls();
        
        var settings = appCtxt.getSettings();
        var listener = new AjxListener(this, this._settingChangeListener);
        settings.getSetting(ZmSetting.CAL_EMAIL_REMINDERS_ADDRESS).addChangeListener(listener);
        settings.getSetting(ZmSetting.CAL_DEVICE_EMAIL_REMINDERS_ADDRESS).addChangeListener(listener);
    }
};

ZmTaskEditView.prototype._remindDateBtnListener =
function(ev) {
	var calDate = ev.item == this._remindDateButton
		? AjxDateUtil.simpleParseDateStr(this._remindDateField.value)
		: null;

	// if date was input by user and its foobar, reset to today's date
	if (calDate == null || isNaN(calDate)) {
		calDate = new Date();
		var field = ev.item == this._remindDateButton ? this._remindDateField : null;

        var calEndDate = AjxDateUtil.simpleParseDateStr(this._endDateField.value);
        if (calEndDate != null || isNaN(calEndDate)) {
            calDate = calEndDate;
        }
        
        field.value = AjxDateUtil.simpleComputeDateStr(calDate);
	}

	// always reset the date to current field's date
	var menu = ev.item.getMenu();
	var cal = menu.getItem(0);
	cal.setDate(calDate, true);
	ev.item.popup();
};

ZmTaskEditView.prototype._dateCalSelectionListener = function(ev) {

    ZmCalItemEditView.prototype._dateCalSelectionListener.call(this,ev);

    var parentButton = ev.item.parent.parent;
	var newDate = AjxDateUtil.simpleComputeDateStr(ev.detail);

    var ed = AjxDateUtil.simpleParseDateStr(this._endDateField.value);
    var sd = AjxDateUtil.simpleParseDateStr(this._startDateField.value);
    var rd = AjxDateUtil.simpleParseDateStr(this._remindDateField.value);

	// change the start/end date if they mismatch
	if (parentButton == this._endDateButton) {
		if(rd && (rd.valueOf() > ev.detail.valueOf())) {
            this._remindDateField.value = newDate;
        }
		//this._endDateField.value = newDate;
	} else if(parentButton == this._remindDateButton) {
        if (ed && (ed.valueOf() < ev.detail.valueOf())) {
			this._endDateField.value = newDate;
        }
        if (ed == null && sd && (sd.valueOf() < ev.detail.valueOf())) {
			this._startDateField.value = newDate;
        }
		this._remindDateField.value = newDate;
	} else if(parentButton == this._startDateButton) {
        if (ed == null && rd && (rd.valueOf() > ev.detail.valueOf())) {
              this._remindDateField.value = newDate;
        }
    }
    
};


ZmTaskEditView.prototype._addEventHandlers =
function() {
	var edvId = AjxCore.assignId(this);

	// add event listeners where necessary
	Dwt.setHandler(this._statusCheckbox, DwtEvent.ONCLICK, ZmCalItemEditView._onClick);
	//Dwt.setHandler(this._repeatDescField, DwtEvent.ONCLICK, ZmCalItemEditView._onClick);
	//Dwt.setHandler(this._repeatDescField, DwtEvent.ONMOUSEOVER, ZmCalItemEditView._onMouseOver);
	//Dwt.setHandler(this._repeatDescField, DwtEvent.ONMOUSEOUT, ZmCalItemEditView._onMouseOut);

	//this._repeatDescField._editViewId =
    if (this._hasReminderSupport) {
        // TODO: What is this for?
        this._statusCheckbox._editViewId = this._reminderCheckbox._editViewId = edvId;
    }
};

// cache all input fields so we dont waste time traversing DOM each time
ZmTaskEditView.prototype._cacheFields =
function() {
	ZmCalItemEditView.prototype._cacheFields.call(this);
	this._statusCheckbox = document.getElementById(this._statusCheckboxId);
    
	// HACK: hide all recurrence-related fields until tasks supports it
	//this._repeatSelect.setVisibility(false);
	//var repeatLabel = document.getElementById(this._htmlElId + "_repeatLabel");
	//Dwt.setVisibility(repeatLabel, false);
	//Dwt.setVisibility(this._repeatDescField, false);
    this._setRemindersEnabled(false);
};

// Returns a string representing the form content
ZmTaskEditView.prototype._formValue =
function(excludeAttendees) {
	var vals = [];

	vals.push(this._subjectField.getValue());
	vals.push(this._location.getValue());
	vals.push(this._prioritySelect.getValue());
	vals.push(this._folderSelect.getValue());
	vals.push("" + this._statusCheckbox.checked);
	vals.push(this._pCompleteSelect.getValue());
	vals.push(this._statusSelect.getValue());
	var startDate = AjxDateUtil.simpleParseDateStr(this._startDateField.value);
	if (startDate) vals.push(AjxDateUtil.getServerDateTime(startDate));
	var endDate = AjxDateUtil.simpleParseDateStr(this._endDateField.value);
	if (endDate) vals.push(AjxDateUtil.getServerDateTime(endDate));

    if (this._hasReminderSupport) {
        var hasReminder = this._reminderCheckbox.isSelected();
        vals.push(hasReminder);
        if (hasReminder) {
            var remindDate = AjxDateUtil.simpleParseDateStr(this._remindDateField.value);
            remindDate = this._remindTimeSelect.getValue(remindDate);
            if(remindDate) {
                vals.push(
                    AjxDateUtil.getServerDateTime(remindDate)
                );
            }
            vals.push(this._reminderEmailCheckbox.isSelected());
            vals.push(this._reminderDeviceEmailCheckbox.isSelected());
        }
    }

	//vals.push(this._repeatSelect.getValue());
	vals.push(this._notesHtmlEditor.getContent());

	var str = vals.join("|");
	str = str.replace(/\|+/, "|");
	return str;
};

ZmTaskEditView.prototype._addTabGroupMembers =
function(tabGroup) {
	tabGroup.addMember(this._subjectField);
	tabGroup.addMember(this._location);

	var bodyFieldId = this._notesHtmlEditor.getBodyFieldId();
	tabGroup.addMember(document.getElementById(bodyFieldId));
};

// Consistent spot to locate various dialogs
ZmTaskEditView.prototype._getDialogXY =
function() {
	var loc = Dwt.toWindow(this.getHtmlElement(), 0, 0);
	return new DwtPoint(loc.x + ZmTaskEditView.DIALOG_X, loc.y + ZmTaskEditView.DIALOG_Y);
};

ZmTaskEditView.prototype._setPercentCompleteFields =
function(isComplete) {
	var val = isComplete
		? ZmTaskEditView.STATUS_VALUES[1]
		: ZmTaskEditView.STATUS_VALUES[0];
	this._statusSelect.setSelectedValue(val);
	this._pCompleteSelect.setSelected(isComplete ? (this._pCompleteSelect.size()-1) : 0);
};

ZmTaskEditView.prototype._setRemindersEnabled =
function(isEnabled) {
    if (this._hasReminderSupport) {
        this._remindDateButton.setEnabled(isEnabled);
        this._remindTimeSelect.setEnabled(isEnabled);
        Dwt.addClass(this._remindDateField.parentNode, !isEnabled ? 'DWTInputField-disabled' : 'DWTInputField', !isEnabled ? 'DWTInputField' : 'DWTInputField-disabled');
        this._remindDateField.disabled = !isEnabled;
    }
};

// Listeners

ZmTaskEditView.prototype._selectListener =
function(ev) {
	var newVal = ev._args.newValue;
	var oldVal = ev._args.oldValue;

	if (newVal == oldVal) { return; }

	var selObj = ev._args.selectObj;

	this._statusCheckbox.checked = false;

	if (selObj == this._statusSelect) {
		if (newVal == ZmCalendarApp.STATUS_COMP) {
			this._pCompleteSelect.setSelectedValue("100");
			this._statusCheckbox.checked = true;
		} else if (newVal == ZmCalendarApp.STATUS_NEED) {
			this._pCompleteSelect.setSelectedValue("0");
		} else if (newVal == ZmCalendarApp.STATUS_INPR) {
			if (this._pCompleteSelect.getValue() == "100") {
				this._pCompleteSelect.setSelectedValue("0");
			}
		}
	} else {
		if (newVal == 100) {
			this._statusSelect.setSelectedValue(ZmCalendarApp.STATUS_COMP);
			this._statusCheckbox.setSelected(true);
		} else if (newVal == 0) {
			this._statusSelect.setSelectedValue(ZmCalendarApp.STATUS_NEED);
		} else if ((oldVal == 0 || oldVal == 100) &&
			 		(newVal > 0 || newVal < 100) &&
					(this._statusSelect.getValue() == ZmCalendarApp.STATUS_COMP ||
					 this._statusSelect.getValue() == ZmCalendarApp.STATUS_NEED))
		{
			this._statusSelect.setSelectedValue(ZmCalendarApp.STATUS_INPR);
		}
	}
};


// Callbacks

ZmTaskEditView.prototype._handleOnClick =
function(el) {
	if (el.id == this._statusCheckboxId) {
		this._setPercentCompleteFields(el.checked);
    }else {
		ZmCalItemEditView.prototype._handleOnClick.call(this, el);
	}
};

//
// ZmCalItemEditView methods
//

ZmTaskEditView.prototype._setEmailReminderControls = function() {
    ZmCalItemEditView.prototype._setEmailReminderControls.apply(this, arguments);
    // primary reminder checkbox overrides other values
    var isSelected = this._reminderCheckbox.isSelected();
    this._remindDateField.disabled = !isSelected;
    this._remindDateButton.setEnabled(isSelected);
    this._remindTimeSelect.setEnabled(isSelected);
    if (!isSelected) {
        this._reminderEmailCheckbox.setEnabled(false);
        this._reminderDeviceEmailCheckbox.setEnabled(false);
    }
};

ZmTaskEditView.prototype.adjustReminderValue = function(calItem) {
    // no-op
};

ZmTaskEditView.prototype._resetReminders = function() {
    // no-op
};