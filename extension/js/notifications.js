// Notification function
// https://developer.mozilla.org/en-US/docs/Web/API/Notification

// main notify function
function eventNotify(theTitle, theTime, theUrl, theBody, options) {

	// do not show notifications on do not disturb mode
	if (!options['notificationsDisableAll'] === true) {

		if (((!options['notificationsDisable30min'] === true) && (theTime == '30')) || ((!options['notificationsDisable15min'] === true) && (theTime == '15'))) {

			// Let's check if the browser supports notifications
			if (!("Notification" in window)) {
				alert("This browser does not support system notifications");
			}

			// Let's check whether notification permissions have already been granted
			else if (Notification.permission === "granted") {
				// If it's okay let's create a notification
				var options = {
					body: theBody,
					icon: '../img/notification-'+theTime+'.png'
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

	}

}