//
// PCCruises Events Extension for Google Chrome
// --------------------------------------------
// https://github.com/yogensia/rGTAV_Cruises_Extension/
//
//
// Original script by Justin Howe [https://github.com/JustinHowe]
// UI (User Interface) by Yogensia [https://github.com/yogensia]
// Ported as an extension by Yogensia [https://github.com/yogensia]
// Includes fixes and contributions by qlimax5000 [https://github.com/qlimax5000]
// and Johninatoooor [https://www.reddit.com/user/Johninatoooor]
//

// Event Title Format: [Region] | [Date] | [Title] | [GMT] | [Time]

var countdowns = [];
var dates = [];
var times = [];
var zones = [];
var epochFuture = [];
var day = "d";
var month = "m";
var year = "y";
var continueLoading = false;
var eventData = [];
var goodEvents = [];
var goodEventsCounter = 0;
var badEventsCounter = 0;
var badEventUrl = [];
var events = [];
var eventTitlesCurrent = [];
var eventTitlesCurrentUrl = [];
var eventsURL = [];
var eventsGame = [];
var epochNow;
var updateCounter = 0;
var finishedCounter = 0;
var noEvents = false;
var options = [];
var debug = true;

// custom console log function for debug mode only
var CruisesLog = function () {
    if (debug && window.console) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('PCCruises:');
        console.log.apply(console, args);
    }
};

// output on console whether we are runing in the background or the popup process
if (typeof background != 'undefined') {
	CruisesLog("Script running in background mode.");
	//CruisesLog("Script running in background mode, running cache garbage collection.");
	//JSONCache.clear();
} else {
	CruisesLog("Script running in popup mode.");
}

// get extension options
function refreshOptions() {
	chrome.storage.sync.get({
		notificationsDisableAll:   false,
		notificationsDisable30min: false,
		notificationsDisable15min: false,
		notificationsDisableNew:   false
	}, function(items) {
		// store options in array
		options['notificationsDisableAll']   = items.notificationsDisableAll;
		options['notificationsDisable30min'] = items.notificationsDisable30min;
		options['notificationsDisable15min'] = items.notificationsDisable15min;
		options['notificationsDisableNew']   = items.notificationsDisableNew;
		CruisesLog('Fetching extension options from storage.');
	});
}
refreshOptions();

// Title Case Helper Function
function toTitleCase(str) {
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// update the countdown timer on the selected event
// this function is called for every valid event found during refreshTimer()
// we also send notifications from here
function timerUpdate(n) {
	// get title ready for notification functionality
	var eventTitle = events[n].replace(/\[/g, "");
	eventTitle = eventTitle.replace(/\]/g, "");
	var eventTitle = eventTitle.split("|");
	var title = eventTitle[2].trim();

	// timer logic
	var timerString = "timer" + n;
	epochNow = Math.floor(Date.now()/1000);
	countdowns[n] = epochFuture[n] - epochNow;
	if (!isNaN(countdowns[n])) {
		s = countdowns[n]%60;
		m = (countdowns[n]-s)/60%60;
		h = ((countdowns[n]-s)/60 - m)/60%24;
		d = (((countdowns[n]-s)/60 - m)/60 - h)/24;
		var txt;
		var inProgress = false;
		if (d == 1) {
			var textDays = " Day, ";
		} else {
			var textDays = " Days, ";
		}
		if (h == 1) {
			var textHours = " Hr";
		} else {
			var textHours = " Hrs";
		}
		// DAYS HRS MIN
		if (d > 0) {
			txt = "Starts in " + d + textDays + h + textHours + ", " + m + " Min";
			$("#event-block-" + n).addClass("state-upcoming");
		}
		// HRS MIN
		if ((d == 0) && (h > 0) && (m > 0)) {
			txt = "Starts in " + h + textHours + ", " + m + " Min";
			$("#event-block-" + n).addClass("state-upcoming");
		}
		// HRS
		if ((d == 0) && (h > 0) && (m == 0)) {
			txt = "Starts in " + h + textHours;
			$("#event-block-" + n).addClass("state-upcoming");
		}
		// MIN
		if ((d == 0) && (h == 0) && (m > 0)) {
			// notifications are handled in the background process
			if (typeof background != 'undefined') {
				// 30/15 minute notifications
				if (m == 30) {
					eventNotify(title, '30', eventsURL[n], 'This event starts in 30 minutes!\nClick here for more info.', options);
					CruisesLog('Event "'+title+'" with url "'+eventsURL[n]+'" starting in 30 min, attempting to notify user...');
				} else if (m == 15) {
					eventNotify(title, '15', eventsURL[n], 'This event starts in 15 minutes!\nClick here for more info.', options);
					CruisesLog('Event "'+title+'" with url "'+eventsURL[n]+'" starting in 15 min, attempting to notify user...');
				}
			}
			txt = "Starts in " + m + " Min";
			$("#event-block-" + n).addClass("state-upcoming");
		}
		// DAYS MIN
		if ((d > 0) && (h == 0) && (m > 0)) {
			txt = "Starts in " + d + textDays + m + " Min";
			$("#event-block-" + n).addClass("state-upcoming");
		}
		// DAYS HRS
		if ((d > 0) && (h > 0) && (m == 0)) {
			txt = "Starts in " + d + textDays + h + textHours;
			$("#event-block-" + n).addClass("state-upcoming");
		}
		// IN PROGRESS
		if ((d == 0) && ((h >= -1) && (h <= 0)) && (m <= 0)) {
			txt = 'Just Started';
			if ((h == 0) && (m < 0)) {
				m = m.toString().replace(/\-/, "");
				txt = 'Started ' + m + " Min ago";
			}
			if (h == -1) {
				h = h.toString().replace(/\-/, "");
				if (m == 0) {
					txt = 'Started ' + h + " Hr ago";
				} else {
					m = m.toString().replace(/\-/, "");
					txt = 'Started ' + h + " Hr, " + m + " Min ago";
				}
			}
			$("#event-block-" + n).addClass("state-progress");
			inProgress = true;
		}
		// FINISHED
		if (((m < 0) && !inProgress) || ((h < 0) && !inProgress)) {
			txt = 'Finished';
			$("#event-block-" + n).removeClass("state-progress").addClass("state-finished");
			$("#event-block-" + n).hide();
		}
		document.getElementById(timerString).innerHTML = "<strong>" + txt + "</strong>";
		CruisesLog("Updated Timer #" + n + " Value to: " + txt);
	} else {
		$("#event-block-" + n).removeClass("state-progress, state-upcoming").addClass("state-warning");
		var badDateTxt = dates[n] + ' @ ' + times[n] + ' ' + zones[n];
		document.getElementById(timerString).innerHTML = badDateTxt;
		CruisesLog("Updated Timer #" + n + " Value with BAD date: " + badDateTxt);
	}
}

// refresh countdown loop and run checkFinished()
function refreshTimer() {
	updateCounter++;
	CruisesLog("------ Timer refresh iteration #" + updateCounter + " ------");
	for (var i=0; i < goodEvents.length; i++) {
		timerUpdate(i);
	}
	checkFinished();
}

// check number of events finished and update Header string
function checkFinished() {
	var finishedCounter = 0;
	for (var n = 0; n < goodEvents.length; n++) {
		if ($('#timer' + n + ':contains("Finished")').length > 0) {
			finishedCounter++;
		} else {
			// get event title
			var eventTitle = events[n].replace(/\[/g, "");
			eventTitle = eventTitle.replace(/\]/g, "");
			eventTitle = eventTitle.split("|");
			var title = eventTitle[2].trim();

			// add titles of active events to an array to check later for new event notifications
			eventTitlesCurrent.unshift(title);
			eventTitlesCurrentUrl.unshift(eventsURL[n]);
		}
	}

	// update icon badge and tooltip
	var newHeaderCounter = goodEvents.length - finishedCounter;
	chrome.browserAction.setBadgeText({text: newHeaderCounter.toString()}); // length have 10+ unread items.
	chrome.browserAction.setTitle({title: "r/GTAVCruises: "+newHeaderCounter+" Cruises Found"})
	//chrome.browserAction.setBadgeBackgroundColor({color: "#56973b"}); // green
	chrome.browserAction.setBadgeBackgroundColor({color: "#0c7cc4"}); // blue

	if (finishedCounter != 0) {
		CruisesLog(finishedCounter + " Events Finished, Changing Header to " + newHeaderCounter + " Events");
		$("#eventsHeader").text(newHeaderCounter + ' Cruises Found');
	}

	if (finishedCounter == goodEvents.length) {
		noEvents = true;
		$("#eventsHeader").text("0 Cruises Found");
		$("#topBodyText").text("");
		$("#eventsContent").replaceWith('<div id="eventsContent"><div id="no-cruises"><h3>No Cruises Found!</h3><p><a href="https://www.reddit.com/r/GTAV_Cruises/submit?custom_button&create_event&selftext=true&title=%5BRegion%5D%20%7C%20%5BDate%5D%20%7C%20%5BTitle%5D%20%7C%20%5BGMT%5D%20%7C%20%5BTime%5D&text=**Title**%3A%20%5BEvent%20Name%5D%0A%0A**Date**%3A%20%5BDate%2C%20Time%20and%20Timezone%5D%0A%0A**Region**%3A%20%5BUS%2C%20EU%2C%20Asia%5D%0A%0A**Duration**%3A%20%5BExpected%20Duration%5D%0A%0A**Host**%3A%20%5BAlias%20%2B%20RGSC%20ID%5D%0A%0A**Vehicle%20type**%3A%20%5BFree%2C%20Off-road%2C%20Muscle%2C%20etc.%5D%0A%0A**Players**%3A%20%5BMax%20Players%5D%0A%0A**Activities**%3A%20%5BDrags%2C%20Cruise%2C%20Drifting%2C%20etc.%5D%0A%0A**Special%20requirements**%3A%20%5BAny%20Special%20Requirements%5D%0A%0A**Custom%20rules**%3A%20%5BNo%20%2F%20Yes%5D%0A%0A**Notes**%3A%20%5BAny%20Other%20Information%5D">Won\'t you liven things up a bit and create one?</a></p></div></div>');
	}

	if ((newHeaderCounter == 1) && !noEvents) {
		$("#eventsHeader").text(newHeaderCounter + ' Cruise Found');
	}
}

function getBadDate(badDate) {
	if (badDate.indexOf("jan") >= 0) {
		month = 1
	}
	if (badDate.indexOf("feb") >= 0) {
		month = 2
	}
	if (badDate.indexOf("mar") >= 0) {
		month = 3
	}
	if (badDate.indexOf("apr") >= 0) {
		month = 4
	}
	if (badDate.indexOf("may") >= 0) {
		month = 5
	}
	if (badDate.indexOf("jun") >= 0) {
		month = 6
	}
	if (badDate.indexOf("jul") >= 0) {
		month = 7
	}
	if (badDate.indexOf("aug") >= 0) {
		month = 8
	}
	if (badDate.indexOf("sep") >= 0) {
		month = 9
	}
	if (badDate.indexOf("oct") >= 0) {
		month = 10
	}
	if (badDate.indexOf("nov") >= 0) {
		month = 11
	}
	if (badDate.indexOf("dec") >= 0) {
		month = 12
	}

	year = badDate.match(/\d{4}/);
	day = badDate.replace(year, "");
	day = day.replace(/\D+/g, "");
	day = parseInt(day, 10);
}

// big ass function that runs when we get the event data from JSON request
function JSONSuccess(data) {
	// Get events from JSON response
	for (var i = data["data"]["children"].length - 1; i >= 0; i--) {
		events[i] = data["data"]["children"][i]["data"]["title"];
		eventsURL[i] = data["data"]["children"][i]["data"]["url"];
	};

	CruisesLog("Events Found: " + events.length);

	// Do initial format check and store found events
	for (var j = 0; j < events.length; j++) {
		var tempEvent = events[j];
		tempEvent = tempEvent.replace(/[^\|]/g, "").length;
		if (tempEvent == 4) {
			goodEvents[goodEventsCounter] = events[j];
			goodEventsCounter++;
		} else {
			badEventsCounter++;
			var badEventIndex = badEventsCounter - 1;
			badEventUrl[badEventIndex] = [events[j], eventsURL[j]];
		}
	}

	// Check for bad formated events and print them separately
	if (badEventsCounter > 0) {
		var errorCruise = "cruises";
		if (badEventsCounter == 1) {
			errorCruise = "cruise";
		}

		for (var k = 0; k < badEventUrl.length; k++) {
			$("#footer").prepend('<p class="event-block state-warning"><a href="' + badEventUrl[k][1] + '" target="_blank">' + badEventUrl[k][0] + '</a><a class="block-link" href="' + badEventUrl[k][1] + '" target="_blank"></a></p>');
		}

		$("#footer").prepend('<p class="events-error">Omitting ' + badEventsCounter + ' ' + errorCruise + ' - Invalid title format:</p>');
	}

	CruisesLog("Good Events Found: " + goodEvents.length);
	CruisesLog("Bad Events Found: " + badEventsCounter);

	if (goodEvents.length < 1) {
		chrome.browserAction.setBadgeText({text: '0'});
		chrome.browserAction.setTitle({title: "r/GTAVCruises: 0 Cruises Found"})
		$("#eventsHeader").text("0 Cruises Found");
		$("#topBodyText").text("");
		$("#eventsContent").replaceWith('<div id="eventsContent"><div id="no-cruises"><h3>No Cruises Found!</h3><p><a href="https://www.reddit.com/r/GTAV_Cruises/submit?custom_button&create_event&selftext=true&title=%5BRegion%5D%20%7C%20%5BDate%5D%20%7C%20%5BTitle%5D%20%7C%20%5BGMT%5D%20%7C%20%5BTime%5D&text=**Title**%3A%20%5BEvent%20Name%5D%0A%0A**Date**%3A%20%5BDate%2C%20Time%20and%20Timezone%5D%0A%0A**Region**%3A%20%5BUS%2C%20EU%2C%20Asia%5D%0A%0A**Duration**%3A%20%5BExpected%20Duration%5D%0A%0A**Host**%3A%20%5BAlias%20%2B%20RGSC%20ID%5D%0A%0A**Vehicle%20type**%3A%20%5BFree%2C%20Off-road%2C%20Muscle%2C%20etc.%5D%0A%0A**Players**%3A%20%5BMax%20Players%5D%0A%0A**Activities**%3A%20%5BDrags%2C%20Cruise%2C%20Drifting%2C%20etc.%5D%0A%0A**Special%20requirements**%3A%20%5BAny%20Special%20Requirements%5D%0A%0A**Custom%20rules**%3A%20%5BNo%20%2F%20Yes%5D%0A%0A**Notes**%3A%20%5BAny%20Other%20Information%5D">Won\'t you liven things up a bit and create one?</a></p></div></div>');
	} else {
		if (goodEvents.length == 1) {
			$("#eventsHeader").text(goodEvents.length + ' Cruise Found');
		} else {
			$("#eventsHeader").text(goodEvents.length + ' Cruises Found');
		}
		continueLoading = true;
	}

	// Date and time conversion wizardry
	if (continueLoading) {
		for (var i=0; i < goodEvents.length; i++) {
			var eventNumber = i + 1;
			var eventString = goodEvents[i];
			var wellFormedEvent = eventString.replace(/[^\|]/g, "").length;
			if (wellFormedEvent == 4) {
				eventString = eventString.replace(/\[/g, "");
				eventString = eventString.replace(/\]/g, "");
				CruisesLog("------ Event #"+eventNumber+" ------");
				CruisesLog("Event String: " + eventString);
				var href = eventsURL[i];
				var eventParts = eventString.split("|");
				var region = eventParts[0];

				//Determine date parts
				var date = eventParts[1];
				dates[i] = eventParts[1];
				date = eventParts[1].replace(/\-/g, "/");
				CruisesLog("Date: " + date);
				if (date.indexOf("/") >= 0) {
					date = date.split("/");
					day = parseInt(date[0], 10);
					month = parseInt(date[1], 10);

					if (month > 12) {
						day = parseInt(date[1], 10);
						month = parseInt(date[0], 10);
					}

					if (!date[2]) {
						year = new Date().getFullYear();
					} else {
						year = date[2];
						var yearFirstChar = year.charAt(0);

						if (yearFirstChar != "2") {
							year = "20" + year;
						}
						year = parseInt(year, 10);
					}

					var monthCurrentEpoch = Date.now();
					var monthAheadEpoch = (monthCurrentEpoch + 2678400000)/1000;
					var eventEpoch = Date.UTC(year,month-1,day,12,0)/1000;
					CruisesLog("Date Epochs: " + monthAheadEpoch + " / " + eventEpoch);

					if (eventEpoch > monthAheadEpoch) {
						day = parseInt(date[1], 10);
						month = parseInt(date[0], 10);
					}

				}

				if ((date.indexOf("/") < 0) && (date.indexOf("2015") >= 0)) {
					getBadDate(date.toLowerCase());
				}

				//var title = toTitleCase(eventParts[2]); //Convert to lowercast starting with 2nd character of each word
				var title = eventParts[2];
				var titleShort;

				//Log original time and timezone
				CruisesLog("Event title: " + title + " - " + eventParts[4] + " - " + day + "/" + month + "/" + year + " - " + eventParts[3]);

				//Convert to four-digit military time and UTC time zone.
				var time = eventParts[4];
				if (time.indexOf(":") < 0) {
					if (time.toLowerCase().indexOf("am") >= 0) {
						time = time.replace(/AM/g, "");
						time = time.replace(/am/g, "");
					}
					if (time.toLowerCase().indexOf("pm") >= 0) {
						time = time.replace(/PM/g, "");
						time = time.replace(/pm/g, "");
					}
					time = time.replace(/ /g, "");
					if (time.length == 1) {
						time = time + ":00";
						CruisesLog("Converted Time " + eventParts[4] + " To: " + time);
					} else if (time.length == 2) {
						time = time + ":00";
						CruisesLog("Converted Time " + eventParts[4] + " To: " + time);
					} else if (time.length == 3) {
						var time1 = time.charAt(0);
						var time2 = time.replace(time1, "");
						time = time1 + ":" + time2;
						CruisesLog("Converted Time " + eventParts[4] + " To: " + time);
					} else if (time.length == 4) {
						var time1 = time.substring(0, 2);
						var time2 = time.substring(2, 4);
						time = time1 + ":" + time2;
						CruisesLog("Converted Time " + eventParts[4] + " To: " + time);
					}
				}
				time = time.split(":");
				times[i] = eventParts[4];
				var hour = time[0];
				var minute = time[1];
				hour = hour.replace(/ /g, "");
				hour = parseInt(hour, 10);
				minute = minute.replace(/ /g, "");
				minute = parseInt(minute, 10);

				if (times[i].toLowerCase().indexOf("pm") >= 0) {
					if (hour < 12) {
						hour = hour + 12;
					}
				}

				CruisesLog("24hr Hour: " + hour);

				var timezone = eventParts[3];
				zones[i] = timezone;

				//Get daylight savings time epochs
				var dayDSTStart;
				var monthDSTStart;
				var dayDSTStop;
				var monthDSTStop;

				if (year == 2015) {
					dayDSTStart = 8;
					monthDSTStart = 3;
					dayDSTStop = 1;
					monthDSTStop = 11;
				}

				if (year == 2016) {
					dayDSTStart = 13;
					monthDSTStart = 3;
					dayDSTStop = 6;
					monthDSTStop = 11;
				}

				if (year == 2017) {
					dayDSTStart = 12;
					monthDSTStart = 3;
					dayDSTStop = 5;
					monthDSTStop = 11;
				}

				if (year == 2018) {
					dayDSTStart = 11;
					monthDSTStart = 3;
					dayDSTStop = 4;
					monthDSTStop = 11;
				}

				if (year == 2019) {
					dayDSTStart = 10;
					monthDSTStart = 3;
					dayDSTStop = 3;
					monthDSTStop = 11;
				}

				if (year == 2020) {
					dayDSTStart = 8;
					monthDSTStart = 3;
					dayDSTStop = 1;
					monthDSTStop = 11;
				}

				var epochDSTStart;
				var epochDSTStop;
				epochNow = Date.now();
				CruisesLog("Epoch Now: " + epochNow);

				if ((timezone.toLowerCase().indexOf("pst") >= 0) || (timezone.toLowerCase().indexOf("pdt") >= 0)) {
					epochDSTStart = Date.UTC(year,monthDSTStart-1,dayDSTStart,09,00);
					epochDSTStop = Date.UTC(year,monthDSTStop-1,dayDSTStop,09,00);
					CruisesLog("Epoch DST Start: " + epochDSTStart);
					CruisesLog("Epoch DST Stop: " + epochDSTStop);
					if ((epochNow >= epochDSTStart) && (epochNow <= epochDSTStop)) {
						timezone = "UTC-7";
					} else {
						timezone = "UTC-8";
					}
					CruisesLog("Timezone Converted: ")
				}

				if ((timezone.toLowerCase().indexOf("edt") >= 0) || (timezone.toLowerCase().indexOf("est") >= 0)) {
					epochDSTStart = Date.UTC(year,monthDSTStart-1,dayDSTStart,12,00);
					epochDSTStop = Date.UTC(year,monthDSTStop-1,dayDSTStop,12,00);
					CruisesLog("Epoch DST Start: " + epochDSTStart);
					CruisesLog("Epoch DST Stop: " + epochDSTStop);
					if ((epochNow >= epochDSTStart) && (epochNow <= epochDSTStop)) {
						timezone = "UTC-4";
					} else {
						timezone = "UTC-5";
					}
				}

				if ((timezone.toLowerCase().indexOf("cdt") >= 0) || (timezone.toLowerCase().indexOf("cst") >= 0)) {
					epochDSTStart = Date.UTC(year,monthDSTStart-1,dayDSTStart,11,00);
					epochDSTStop = Date.UTC(year,monthDSTStop-1,dayDSTStop,11,00);
					CruisesLog("Epoch DST Start: " + epochDSTStart);
					CruisesLog("Epoch DST Stop: " + epochDSTStop);
					if ((epochNow >= epochDSTStart) && (epochNow <= epochDSTStop)) {
						timezone = "UTC-5";
					} else {
						timezone = "UTC-6";
					}
				}

				if ((timezone.toLowerCase().indexOf("aedt") >= 0) || (timezone.toLowerCase().indexOf("aest") >= 0)) {
					epochDSTStart = Date.UTC(year,monthDSTStart-1,dayDSTStart,20,00);
					epochDSTStop = Date.UTC(year,monthDSTStop-1,dayDSTStop,20,00);
					CruisesLog("Epoch DST Start: " + epochDSTStart);
					CruisesLog("Epoch DST Stop: " + epochDSTStop);
					if ((epochNow >= epochDSTStart) && (epochNow <= epochDSTStop)) {
						timezone = "UTC+11";
					} else {
						timezone = "UTC+10";
					}
				}

				timezone = timezone.replace(/ /g, "");
				var substringBoundry = timezone.length;
				CruisesLog("Timezone Infos: " + timezone + ", length " + substringBoundry);

				var convertedHour = hour;
				CruisesLog("Converted Hour 1: " + convertedHour);

				if (substringBoundry > 4) {
					var timezoneOffsetHours = timezone.substring(4,substringBoundry);
					CruisesLog("Timezone Offset Hours String: " + timezoneOffsetHours);
					timezoneOffsetHours = parseInt(timezoneOffsetHours, 10);
					CruisesLog("Timezone Offset Hours Integer: " + timezoneOffsetHours);

					if (timezone.indexOf("-") >= 0) {
						convertedHour = hour + timezoneOffsetHours;
					}
					if (timezone.indexOf("+") >= 0) {
						convertedHour = hour - timezoneOffsetHours;
					}

					if (convertedHour >= 24) {
						convertedHour = convertedHour - 24;
						day++;

						var daysInMonth = 31;
						if ([9,4,6,11].indexOf(month) >=0) {
							daysInMonth = 30;
						}
						if (month == 2) {
							daysInMonth = 28;
						}

						if (day > daysInMonth) {
							day = 1;
							month++;

							if (month > 12) {
								month = 1;
							}
						}
					}
				}

				// Add title to an array to check later for new events
				eventTitlesCurrent.unshift(title.trim());
				eventTitlesCurrentUrl.unshift(href);

				CruisesLog("Converted Hour 2: " + convertedHour);

				//Output new UTC time
				CruisesLog("Converted to UTC: " + title + " - " + convertedHour + ":" + minute + " - " + day + "/" + month + "/" + year);

				epochFuture[i] = Date.UTC(year,month-1,day,convertedHour,minute);
				CruisesLog("Future Epoch Before MS: " + epochFuture[i]);
				epochFuture[i] = Math.floor(epochFuture[i]/1000);
				//epochFuture = 1440050400;
				epochNow = Math.floor(Date.now()/1000);
				countdowns[i] = epochFuture[i] - epochNow;

				if (!isNaN(countdowns[i])) {
					var localDate = new Date(epochFuture[i]*1000);
					var localDateString = localDate.toString().substring(0,21);
					localDateString = localDateString.split(" ");
					var localDayString = localDateString[0];
					var localMonth = localDateString[1];
					var localDay = localDateString[2];
					var localTimeHr = localDate.getHours();
					CruisesLog("Local Hour: " + localTimeHr);
					var localTimeMin = localDate.getMinutes();
					var amPm;
					if (localTimeHr < 12) {
						amPm = " AM";
					}
					if (localTimeHr > 12) {
						localTimeHr = localTimeHr - 12;
						amPm = " PM";
					}
					if (localTimeHr == 12) {
						amPm = " PM";
					}
					if (localTimeHr == 0) {
						localTimeHr = "12";
					}
					if (localTimeMin < 10) {
						localTimeMin = "0" + localTimeMin;
					}
					localDate = localDayString + " " + localMonth + " " + localDay + " @ " + localTimeHr + ":" + localTimeMin + "" + amPm;
					CruisesLog(localDate);
					eventData[i] = [epochFuture[i], '<div id="event-block-' + i + '" class="event-block"><p class="event-title"><a title="Click to open this cruise on your browser" href="' + href + '">' + title + '</a></p><p id="timer' + i + '" class="event-timer"></p><p class="event-local-date">' + localDate + '</p><a class="block-link" a title="Click to open this cruise on your browser" href="' + href + '"></a></div>'];
				} else {
					eventData[i] = [9999999999, '<div id="event-block-' + i + '" class="event-block"><p class="event-title"><a title="No Countdown Timer - Bad Date - Should be day/month/year. err_code:id10t" href="' + href + '">' + title + '</a></p><p id="timer' + i + '" class="event-timer"></p><p class="event-local-date">' + localDate + '</p><a class="block-link" a title="No Countdown Timer - Bad Date - Should be day/month/year. err_code:id10t" href="' + href + '"></a></div>'];
				}
			}
		}

		CruisesLog('------ End of Events ------');

		eventData.sort(function(a,b) {
			return b[0]-a[0]
		});

		for (var n = 0; n < goodEvents.length; n++) {
			$("#eventsContent").prepend(eventData[n][1]);
		}

		refreshTimer();

		// refresh countdown timers every minute
		setInterval(refreshTimer, 60000);
	}

	// check for new events since last update, if new event is found send notification
	Array.prototype.diff = function(a) {
	    return this.filter(function(i) {return a.indexOf(i) < 0;});
	};

	var stringified = JSON.stringify(eventTitlesCurrent);
	// get last known active event titles from storage, if any
	chrome.storage.local.get({eventTitles: '[]'}, function(items) {
		CruisesLog('Previous events:', items.eventTitles);
		CruisesLog('Current events:', stringified);
		// if there are any last known events, compare them with current active (not finished) events
		if (items.eventTitles !== undefined && typeof(items.eventTitles) == 'string') {
			var eventTitlesNew = eventTitlesCurrent.diff(items.eventTitles);
			CruisesLog('New events:', eventTitlesNew);
			// for each new event found sent a desktop notification
			if (eventTitlesNew.length > 0) {
				for (var i = 0; i < eventTitlesNew.length; i++) {
					CruisesLog('New Event with title "' + eventTitlesNew[i] + '" found, sending user notification...' );
					var thisUrl = eventTitlesCurrentUrl[eventTitlesCurrent.indexOf(eventTitlesNew[i])];
					eventNotify(eventTitlesNew[i], 'new', thisUrl, 'A new event has been posted!\nClick here for more info.', options);
				};
			}
		}
	});
	// store current events in storage as last known
	chrome.storage.local.set({eventTitles: stringified});

	// background only
	if (typeof background != 'undefined') {
		// reload background process every 15 minutes (900.000ms) to catch new events
		setTimeout(function(){ chrome.runtime.reload(); }, 900000);
	}

	// popup only
	if (typeof background == 'undefined') {
		// after loading replace spinner with events
		$("#spin").hide();
		$("#wrapper").fadeIn();

		// load custom scrollbar
		$("#wrapper").mCustomScrollbar({
			theme:"minimal-dark"
		});
	}
}

// wait for window load before continuing
$(window).load(function(){

	// start editing some html
	var titlebar = '<h3><a id="eventsHeader" href="https://www.reddit.com/r/GTAV_Cruises/search?q=flair%3A%22events%22&restrict_sr=on&sort=new&t=all">Loading...</a></h3>';
	$("#titlebar").prepend(titlebar);

	var eventModuleHTML = '<div id="eventsWidget"><blockquote class="events-module" style="text-align:center"><div id="eventsContent"></div></blockquote></div>';
	$("#wrapper").prepend(eventModuleHTML);

	// get JSON data for reddit event search page
	var upcomingEventsJSON = 'https://www.reddit.com/r/GTAV_Cruises/search.json?q=flair%3A%22events%22&restrict_sr=on&sort=new&t=all';

	// uncomment to use local test event data
	//upcomingEventsJSON = 'events.json';

	// let's cache JSON data to avoid spamming reddit server with requests
	JSONCache.getCachedJSON(upcomingEventsJSON, {
		onerror: function (jqXHR, textStatus, errorThrown, tryNumber) {
			// jQuery.ajax fails
			CruisesLog('Failed JSON fetch number ' + tryNumber + '. Trying again...');
		},
		ongiveup: function (status) {
			// all fetch attemps failed
			// TODO  add some message to let the user know we messed up
			if (status === 'timeout') {
				CruisesLog('Network failure, cannot fetch JSON data.');
			} else {
				if (status) {
					CruisesLog('Failed to get JSON data with error:', status);
				} else {
					CruisesLog('Failed to get JSON data.');
				}
			}
		},
		success: function (data) {
			// uncomment next line to show data object in console
			// CruisesLog('JSON Data fetched successfully:' + data);

			// we've got the stuff, let's continue
			JSONSuccess(data);
		}
	});
});