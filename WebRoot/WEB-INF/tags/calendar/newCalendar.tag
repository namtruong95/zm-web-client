<%@ tag body-content="empty" %>
<%@ attribute name="link" rtexprvalue="true" required="false" %>
<%@ attribute name="url" rtexprvalue="true" required="false" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="app" uri="com.zimbra.htmlclient" %>
<%@ taglib prefix="zm" uri="com.zimbra.zm" %>

<fmt:message var="label" key="calendarNew"/>
<c:set var="newFolderColor" value="${empty param.newFolderColor ? 'blue' : param.newFolderColor}"/>
<c:set var="newFolderStyleColor" value="${zm:getFolderStyleColor(newFolderColor,'appointment')}"/>

<c:set var="newFolderExcludeFlag" value="${empty param.newFolderExcludeFlag ? '' : param.newFolderExcludeFlag}"/>
<c:set var="newFolderCheckedFlag" value="${empty param.newFolderCheckedFlag ? '#' : param.newFolderCheckedFlag}"/>

<table width=100% cellspacing=0 cellpadding=0>
    <tr class='${newFolderStyleColor}${newFolderStyleColor ne 'Gray' ? 'Bg' :''}'>
        <c:set var="icon" value="${link ? 'calendar/SharedCalendarFolder.gif' : 'calendar/CalendarFolder.gif'}"/>
        <td>&nbsp;</td>
        <td width=20>
            <app:img src="${icon}" alt='${fn:escapeXml(label)}'/>
        </td>
        <td class='ZhFolderHeader' colspan=2>
            ${fn:escapeXml(label)}
        </td>
        <td width=1% nowrap class='ZhCalType'>
            <c:choose>
                <c:when test="${url}">
                    <fmt:message key="calendarSubscribed"/>
                </c:when>
                <c:when test="${link}">
                    <fmt:message key="calendarShared"/>
                </c:when>
                <c:otherwise>
                    <fmt:message key="calendarUser"/>
                </c:otherwise>
            </c:choose>
            &nbsp;
        </td>
    </tr>
</table>

<table border="0" cellpadding="0" cellspacing="10" width=100%>


    <tr>
        <td nowrap align=right>
            <fmt:message key="name"/>
            :
        </td>
        <td>
            <input name='newFolderName' type='text' autocomplete='off' size='35' value="${fn:escapeXml(param.newFolderName)}">
        </td>
    </tr>

    <c:if test="${url}">
        <tr>
            <td nowrap align=right>
                <fmt:message key="url"/>
                :
            </td>
            <td>
            <table border="0" cellpadding="0" cellspacing="0">
                <tr valign=center>
                    <td>
                        <input name='newFolderUrl' type='text' autocomplete='off' size='70' value="${fn:escapeXml(param.newFolderUrl)}">
                    </td>
                </tr>
            </table>
            </td>
        </tr>
    </c:if>

    <c:if test="${link}">
        <tr>
            <td nowrap align=right>
                <fmt:message key="ownersEmail"/>
                :
            </td>
            <td>
                <input name='newFolderOwnersEmail' type='text' autocomplete='off' size='35' value="${fn:escapeXml(param.newFolderOwnersEmail)}">
            </td>
        </tr>
        <tr>
            <td nowrap align=right>
                <fmt:message key="ownersCalendarName"/>
                :
            </td>
            <td>
                <input name='newFolderOwnersCalendar' type='text' autocomplete='off' size='35' value="${fn:escapeXml(param.newFolderOwnersCalendar)}">
            </td>
        </tr>
    </c:if>

    <tr>
        <td nowrap align='right'>
            <fmt:message key="color"/>
            :
        </td>
        <td>
            <select name="newFolderColor">
                <option <c:if test="${newFolderColor eq 'blue'}">selected</c:if> value="blue"/><fmt:message key="blue"/>
                <option <c:if test="${newFolderColor eq 'cyan'}">selected</c:if> value="cyan"/><fmt:message key="cyan"/>
                <option <c:if test="${newFolderColor eq 'green'}">selected</c:if> value="green"/><fmt:message key="green"/>
                <option <c:if test="${newFolderColor eq 'purple'}">selected</c:if> value="purple"/><fmt:message key="purple"/>
                <option <c:if test="${newFolderColor eq 'red'}">selected</c:if> value="red"/><fmt:message key="red"/>
                <option <c:if test="${newFolderColor eq 'yellow'}">selected</c:if> value="yellow"/><fmt:message key="yellow"/>
                <option <c:if test="${newFolderColor eq 'pink'}">selected</c:if> value="pink"/><fmt:message key="pink"/>
                <option <c:if test="${newFolderColor eq 'gray'}">selected</c:if> value="gray"/><fmt:message key="gray"/>
                <option <c:if test="${newFolderColor eq 'orange'}">selected</c:if> value="orange"/><fmt:message key="orange"/>
            </select>
        </td>
    </tr>
    <tr>
        <td>&nbsp;</td>
        <td nowrap>
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <input name='newFolderExcludeFlag' type='checkbox' <c:if test="${newFolderExcludeFlag eq 'b'}">checked</c:if> value="b">
                    </td
                    <td>&nbsp;</td>
                    <td>
                        <fmt:message key="excludeFromFreeBusyTimes"/>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td>&nbsp;</td>
        <td nowrap>
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <input name='newFolderCheckedFlag' type='checkbox' <c:if test="${newFolderCheckedFlag eq '#'}">checked</c:if> value="#">
                    </td>
                    <td>&nbsp;</td>
                    <td>
                        <fmt:message key="calendarCheckedInUI"/>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td>&nbsp;</td>
        <td>
            <input class='tbButton' type="submit" name="actionCreate"
                   value="<fmt:message key="createCalendar"/>">
            &nbsp;
            <input class='tbButton' type="submit" name="actionCancel"
                   value="<fmt:message key="cancel"/>">
        </td>

    </tr>
</table>
