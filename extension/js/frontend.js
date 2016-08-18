$(function(){

	// spinner
	var opts = {
	  lines: 11 // The number of lines to draw
	, length: 28 // The length of each line
	, width: 14 // The line thickness
	, radius: 42 // The radius of the inner circle
	, scale: 0.5 // Scales overall size of the spinner
	, corners: 1 // Corner roundness (0..1)
	, color: '#000' // #rgb or #rrggbb or array of colors
	, opacity: 0.25 // Opacity of the lines
	, rotate: 0 // The rotation offset
	, direction: 1 // 1: clockwise, -1: counterclockwise
	, speed: 2 // Rounds per second
	, trail: 60 // Afterglow percentage
	, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
	, zIndex: 2e9 // The z-index (defaults to 2000000000)
	, className: 'spinner' // The CSS class to assign to the spinner
	, top: '50%' // Top position relative to parent
	, left: '50%' // Left position relative to parent
	, shadow: false // Whether to render a shadow
	, hwaccel: false // Whether to use hardware acceleration
	, position: 'absolute' // Element positioning
	}
	var target = document.getElementById('spin')
	var spinner = new Spinner(opts).spin(target);


	// titlebar reload icon
	var titlebarReload = document.getElementById('titlebar-reload');
	titlebarReload.addEventListener('click', function() {
		CruisesLog('Reloading...');
		// clear JSON cache from chrome.storage.local
		chrome.storage.local.remove('eventCacheData');
		chrome.storage.local.remove('eventCacheTime');
		// reload popup
		window.location.href="popup.html";
	});

	// titlebar add event icon
	var titlebarAddEvent = document.getElementById('titlebar-add-event');
	titlebarAddEvent.addEventListener('click', function() {
		chrome.tabs.create({url: 'https://www.reddit.com/r/GTAV_Cruises/submit?custom_button&create_event&selftext=true&title=%5BRegion%5D%20%7C%20%5BDate%5D%20%7C%20%5BTitle%5D%20%7C%20%5BGMT%5D%20%7C%20%5BTime%5D&text=**Title**%3A%20%5BEvent%20Name%5D%0A%0A**Date**%3A%20%5BDate%2C%20Time%20and%20Timezone%5D%0A%0A**Region**%3A%20%5BUS%2C%20EU%2C%20Asia%5D%0A%0A**Duration**%3A%20%5BExpected%20Duration%5D%0A%0A**Host**%3A%20%5BAlias%20%2B%20RGSC%20ID%5D%0A%0A**Vehicle%20type**%3A%20%5BFree%2C%20Off-road%2C%20Muscle%2C%20etc.%5D%0A%0A**Players**%3A%20%5BMax%20Players%5D%0A%0A**Activities**%3A%20%5BDrags%2C%20Cruise%2C%20Drifting%2C%20etc.%5D%0A%0A**Special%20requirements**%3A%20%5BAny%20Special%20Requirements%5D%0A%0A**Custom%20rules**%3A%20%5BNo%20%2F%20Yes%5D%0A%0A**Notes**%3A%20%5BAny%20Other%20Information%5D'});
	});

	// titlebar notification icon
	var titlebarNotifications = document.getElementById('titlebar-notifications');
	titlebarNotifications.addEventListener('click', function() {
		// get notification settings
		chrome.storage.sync.get('notificationsDisableAll', function(items) {
			notificationsDisableAll = items.notificationsDisableAll;
			$('#titlebar-notifications').toggleClass('off');
			if ( notificationsDisableAll === true ) {
				chrome.storage.sync.set({ notificationsDisableAll: false })
			} else {
				chrome.storage.sync.set({ notificationsDisableAll: true })
			}
			// make sure the script reloads options after changing them
			refreshOptions();
		});
	});

	// get notification settings
	var notificationsDisableAll;
	chrome.storage.sync.get('notificationsDisableAll', function(items) {
		notificationsDisableAll = items.notificationsDisableAll;
		// set initial state of notifications icon
		if ( notificationsDisableAll === true ) {
			$('#titlebar-notifications').addClass('off');
		}
	});

	// titlebar about icon
	var titlebarAbout = document.getElementById('titlebar-about');
	titlebarAbout.addEventListener('click', function() {
		$('#about-screen').fadeIn();
	});

	// about screen close icon
	var titlebarAboutClose = document.getElementById('about-close');
	titlebarAboutClose.addEventListener('click', function() {
		$('#about-screen').fadeOut();
	});

	// options link in about screen
	var editOptionsLink = document.getElementById('edit-options-link');
	editOptionsLink.addEventListener('click', function() {
		if (chrome.runtime.openOptionsPage) {
			// Chrome 42+ options page
			chrome.runtime.openOptionsPage();
		} else {
			// fallback
			window.open(chrome.runtime.getURL('options.html'));
		}
	});

	// all links in popup should open in new tabs
	$(document).ready(function(){
		$('body').on('click', 'a', function(){
			chrome.tabs.create({url: $(this).attr('href')});
			return false;
		});
	});

});