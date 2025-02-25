/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { document } from '@ephox/dom-globals';

/**
 * This class handles keyboard navigation of controls and elements.
 *
 * @class tinymce.ui.KeyboardNavigation
 */

const hasTabstopData = function (elm) {
  return elm.getAttribute('data-mce-tabstop') ? true : false;
};

export default function (settings) {
  const root = settings.root;
  let focusedElement, focusedControl;

  function isElement(node) {
    return node && node.nodeType === 1;
  }

  try {
    focusedElement = document.activeElement;
  } catch (ex) {
    // IE sometimes fails to return a proper element
    focusedElement = document.body;
  }

  focusedControl = root.getParentCtrl(focusedElement);

  /**
   * Returns the currently focused elements wai aria role of the currently
   * focused element or specified element.
   *
   * @private
   * @param {Element} elm Optional element to get role from.
   * @return {String} Role of specified element.
   */
  function getRole(elm?) {
    elm = elm || focusedElement;

    if (isElement(elm)) {
      return elm.getAttribute('role');
    }

    return null;
  }

  /**
   * Returns the wai role of the parent element of the currently
   * focused element or specified element.
   *
   * @private
   * @param {Element} elm Optional element to get parent role from.
   * @return {String} Role of the first parent that has a role.
   */
  function getParentRole(elm?) {
    let role, parent = elm || focusedElement;

    while ((parent = parent.parentNode)) {
      if ((role = getRole(parent))) {
        return role;
      }
    }
  }

  /**
   * Returns a wai aria property by name for example aria-selected.
   *
   * @private
   * @param {String} name Name of the aria property to get for example "disabled".
   * @return {String} Aria property value.
   */
  function getAriaProp(name) {
    const elm = focusedElement;

    if (isElement(elm)) {
      return elm.getAttribute('aria-' + name);
    }
  }

  /**
   * Is the element a text input element or not.
   *
   * @private
   * @param {Element} elm Element to check if it's an text input element or not.
   * @return {Boolean} True/false if the element is a text element or not.
   */
  function isTextInputElement(elm) {
    const tagName = elm.tagName.toUpperCase();

    // Notice: since type can be "email" etc we don't check the type
    // So all input elements gets treated as text input elements
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  }

  /**
   * Returns true/false if the specified element can be focused or not.
   *
   * @private
   * @param {Element} elm DOM element to check if it can be focused or not.
   * @return {Boolean} True/false if the element can have focus.
   */
  function canFocus(elm) {
    if (isTextInputElement(elm) && !elm.hidden) {
      return true;
    }

    if (hasTabstopData(elm)) {
      return true;
    }

    if (/^(button|menuitem|checkbox|tab|menuitemcheckbox|option|gridcell|slider)$/.test(getRole(elm))) {
      return true;
    }

    return false;
  }

  /**
   * Returns an array of focusable visible elements within the specified container element.
   *
   * @private
   * @param {Element} elm DOM element to find focusable elements within.
   * @return {Array} Array of focusable elements.
   */
  function getFocusElements(elm) {
    const elements = [];

    function collect(elm) {
      if (elm.nodeType !== 1 || elm.style.display === 'none' || elm.disabled) {
        return;
      }

      if (canFocus(elm)) {
        elements.push(elm);
      }

      for (let i = 0; i < elm.childNodes.length; i++) {
        collect(elm.childNodes[i]);
      }
    }

    collect(elm || root.getEl());

    return elements;
  }

  /**
   * Returns the navigation root control for the specified control. The navigation root
   * is the control that the keyboard navigation gets scoped to for example a menubar or toolbar group.
   * It will look for parents of the specified target control or the currently focused control if this option is omitted.
   *
   * @private
   * @param {tinymce.ui.Control} targetControl Optional target control to find root of.
   * @return {tinymce.ui.Control} Navigation root control.
   */
  function getNavigationRoot(targetControl?) {
    let navigationRoot, controls;

    targetControl = targetControl || focusedControl;
    controls = targetControl.parents().toArray();
    controls.unshift(targetControl);

    for (let i = 0; i < controls.length; i++) {
      navigationRoot = controls[i];

      if (navigationRoot.settings.ariaRoot) {
        break;
      }
    }

    return navigationRoot;
  }

  /**
   * Focuses the first item in the specified targetControl element or the last aria index if the
   * navigation root has the ariaRemember option enabled.
   *
   * @private
   * @param {tinymce.ui.Control} targetControl Target control to focus the first item in.
   */
  function focusFirst(targetControl) {
    const navigationRoot = getNavigationRoot(targetControl);
    const focusElements = getFocusElements(navigationRoot.getEl());

    if (navigationRoot.settings.ariaRemember && 'lastAriaIndex' in navigationRoot) {
      moveFocusToIndex(navigationRoot.lastAriaIndex, focusElements);
    } else {
      moveFocusToIndex(0, focusElements);
    }
  }

  /**
   * Moves the focus to the specified index within the elements list.
   * This will scope the index to the size of the element list if it changed.
   *
   * @private
   * @param {Number} idx Specified index to move to.
   * @param {Array} elements Array with dom elements to move focus within.
   * @return {Number} Input index or a changed index if it was out of range.
   */
  function moveFocusToIndex(idx, elements) {
    if (idx < 0) {
      idx = elements.length - 1;
    } else if (idx >= elements.length) {
      idx = 0;
    }

    if (elements[idx]) {
      elements[idx].focus();
    }

    return idx;
  }

  /**
   * Moves the focus forwards or backwards.
   *
   * @private
   * @param {Number} dir Direction to move in positive means forward, negative means backwards.
   * @param {Array} elements Optional array of elements to move within defaults to the current navigation roots elements.
   *
   * @return {Boolean} Whether focus moved.
   */
  function moveFocus(dir, elements?) {
    let idx = -1;
    const navigationRoot = getNavigationRoot();

    elements = elements || getFocusElements(navigationRoot.getEl());

    for (let i = 0; i < elements.length; i++) {
      if (elements[i] === focusedElement) {
        idx = i;
      }
    }

    idx += dir;

    if (!navigationRoot.settings.wrapFocus && (idx < 0 || idx >= elements.length)) {
      return false;
    }

    navigationRoot.lastAriaIndex = moveFocusToIndex(idx, elements);

    return true;
  }

  /**
   * Moves the focus to the left this is called by the left key.
   *
   * @private
   */
  function left() {
    const parentRole = getParentRole();

    if (parentRole === 'tablist') {
      moveFocus(-1, getFocusElements(focusedElement.parentNode));
    } else if (focusedControl.parent().submenu) {
      cancel();
    } else {
      moveFocus(-1);
    }
  }

  /**
   * Moves the focus to the right this is called by the right key.
   *
   * @private
   */
  function right() {
    const role = getRole(), parentRole = getParentRole();

    if (parentRole === 'tablist') {
      moveFocus(1, getFocusElements(focusedElement.parentNode));
    } else if (role === 'menuitem' && parentRole === 'menu' && getAriaProp('haspopup')) {
      enter();
    } else {
      moveFocus(1);
    }
  }

  /**
   * Moves the focus to the up this is called by the up key.
   *
   * @private
   */
  function up() {
    moveFocus(-1);
  }

  /**
   * Moves the focus to the up this is called by the down key.
   *
   * @private
   */
  function down() {
    const role = getRole(), parentRole = getParentRole();

    if (role === 'menuitem' && parentRole === 'menubar') {
      enter();
    } else if (role === 'button' && getAriaProp('haspopup')) {
      enter({ key: 'down' });
    } else {
      moveFocus(1);
    }
  }

  /**
   * Moves the focus to the next item or previous item depending on shift key.
   *
   * @private
   * @param {DOMEvent} e DOM event object.
   */
  function tab(e) {
    const parentRole = getParentRole();

    if (parentRole === 'tablist') {
      const elm = getFocusElements(focusedControl.getEl('body'))[0];

      if (elm) {
        elm.focus();
      }

      return true;
    } else {
      const navigationRoot = getNavigationRoot(),
        ignoreTab = navigationRoot && navigationRoot.settings.ignoreTab;

      return !ignoreTab ? moveFocus(e.shiftKey ? -1 : 1) : false;
    }
  }

  /**
   * Calls the cancel event on the currently focused control. This is normally done using the Esc key.
   *
   * @private
   */
  function cancel() {
    return focusedControl.fire('cancel');
  }

  /**
   * Calls the click event on the currently focused control. This is normally done using the Enter/Space keys.
   *
   * @private
   * @param {Object} aria Optional aria data to pass along with the enter event.
   */
  function enter(aria?) {
    aria = aria || {};
    focusedControl.fire('click', { target: focusedElement, aria });
  }

  root.on('keydown', function (e) {
    function handleNonTabOrEscEvent(e, handler) {
      // Ignore non tab keys for text elements
      if (isTextInputElement(focusedElement) || hasTabstopData(focusedElement)) {
        return;
      }

      if (getRole(focusedElement) === 'slider') {
        return;
      }

      if (handler(e) !== false) {
        e.preventDefault();
      }
    }

    if (e.isDefaultPrevented()) {
      return;
    }

    switch (e.keyCode) {
      case 37: // DOM_VK_LEFT
        handleNonTabOrEscEvent(e, left);
        break;

      case 39: // DOM_VK_RIGHT
        handleNonTabOrEscEvent(e, right);
        break;

      case 38: // DOM_VK_UP
        handleNonTabOrEscEvent(e, up);
        break;

      case 40: // DOM_VK_DOWN
        handleNonTabOrEscEvent(e, down);
        break;

      case 27: // DOM_VK_ESCAPE
        const cancelEv = cancel();
        if (cancelEv.isDefaultPrevented()) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (cancelEv.isPropagationStopped()) {
          e.stopPropagation();
        }
        break;

      case 14: // DOM_VK_ENTER
      case 13: // DOM_VK_RETURN
      case 32: // DOM_VK_SPACE
        handleNonTabOrEscEvent(e, enter);
        break;

      case 9: // DOM_VK_TAB
        if (tab(e) !== false) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
    }
  });

  root.on('focusin', function (e) {
    focusedElement = e.target;
    focusedControl = e.control;
  });

  return {
    focusFirst
  };
}