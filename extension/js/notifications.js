// Notifications for Events
// https://developer.mozilla.org/en-US/docs/Web/API/Notification

// variables
var debug = true;

// custom console log function for debug mode only
var NotifyLog = function () {
    if (debug && window.console) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('PCCruises Notify:');
        console.log.apply(console, args);
    }
};

/**
 * Sends a notification to user using the parameters given
 *
 * @param string $theTitle   Event title.
 * @param string $theTime    Minutes until event starts.
 * @param string $theGame    Game this notification is for (GTAV or Forza).
 * @param string $theUrl     URL of the event.
 * @param string $theBody    Message of the notification.
 * @param string $options    Additional options array.
 */
function eventNotify(theTitle, theTime, theGame, theUrl, theBody, options) {

	// do not show notifications on do not disturb mode
	if (options['notificationsDisableAll'] === true) {
		NotifyLog('All notifications disabled by user settings!');
		return false;
	}

	// check notification conditions
	if ((options['notificationsDisableGTAV'] === true) && (theGame == 'GTAV')) {
		NotifyLog('GTAV notifications blocked by user settings!');
		return false;
	}
	if ((options['notificationsDisableForza'] === true) && (theGame == 'Forza')) {
		NotifyLog('Forza notifications blocked by user settings!');
		return false;
	}
	if ((options['notificationsDisable15min'] === true) && (theTime == '15')) {
		NotifyLog('15 minute notifications blocked by user settings!');
		return false;
	}
	if ((options['notificationsDisable30min'] === true) && (theTime == '30')) {
		NotifyLog('30 minute notifications blocked by user settings!');
		return false;
	}
	if ((options['notificationsDisableNew'] === true) && (theTime == 'new')) {
		NotifyLog('New event notifications blocked by user settings!');
		return false;
	}

	// Let's check if the browser supports notifications
	if (!("Notification" in window)) {
		alert("This browser does not support system notifications");
	}

	// Let's check whether notification permissions have already been granted
	else if (Notification.permission === "granted") {
		// If it's okay let's create a notification
		var options = {
			body: theBody,
			icon: '../img/notification-'+theTime+'-'+theGame+'.png'
		}
		var n = new Notification(theTitle, options);

		// open event url on click
		n.onclick = function(event) {
			// prevent the browser from focusing the Notification's tab
			event.preventDefault();
			window.open(theUrl, '_blank');
			// close notification once clicked
			setTimeout(n.close.bind(n), 0);
		}
	}

	// Otherwise, we need to ask the user for permission
	else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (permission) {
			// If the user accepts, let's create a notification
			if (permission === "granted") {
				var notification = new Notification("Hi there!");
			}
		});
	}

}