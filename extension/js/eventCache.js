/**
 *
 * Cache script for events
 * -----------------------
 *
 * Checks if the event JSON data is already available in the chrome.storage.local,
 * if not load it from reddit and saves it to storage for a few minutes.
 *
 * Based on "JSONCache" by:
 * Kimmo Puputti (first.last@futurice.com)
 * Jarno Rantanen (first.last@futurice.com)
 *
 * Licenced under the MIT licence.
 */

(function ($) {

	"use strict"; // trigger ECMAScript 5 Strict Mode

	// Configuration.
	var settings = {

		// Flag to see console.log calls.
		debug: true,

		// Number of times the JSON is attempted to fetch on network errors.
		numTries: 5,

		// Time in milliseconds to wait after a network error before a
		// re-try. Note that this time is doubled after each try.
		waitTime: 200,

		// Cache item validity lifetime in milliseconds.
		itemLifetime: 1000,
	};

	// Namespace for all the code.
	var JSONCache = {};
	JSONCache.settings = settings;

	var log = function () {
		if (settings.debug && window.console) {
			var args = Array.prototype.slice.call(arguments);
			args.unshift('JSONCache:');
			console.log.apply(console, args);
		}
	};

	// Adds the given data object to the cache, keyed under the given url.
	// Note that the data is assumed to be in its original object state,
	// and will only get serialized/stringified here.
	var addToCache = function (url, data) {
		var stringified = JSON.stringify(data);
		var timestamp = JSONCache._getTime();
		chrome.storage.local.set({eventCacheData: stringified});
		chrome.storage.local.set({eventCacheTime: timestamp});
	};

	var cacheItemValid = function (timestr) {
		var time = parseInt(timestr, 10);
		return !isNaN(time) && (time + settings.itemLifetime >= JSONCache._getTime());
	};

	// Clears the cache (keeps eventTitles to check for new events after reload)
	JSONCache.clear = function () {
		chrome.storage.local.get({
			eventTitles: false
		}, function(items) {
			chrome.storage.local.clear();
			chrome.storage.local.set({eventTitles: items.eventTitles});
		});
		log('Garbage collection done.');
	};

	// Provide the proxy function for testing to mock the real jQuery.getJSON calls.
	JSONCache._getJSONProxy = function (url, options) {
		$.ajax(url, options);
	};

	// Wrap the timestamp generation for easier mocking in the tests.
	JSONCache._getTime = function () {
		return (new Date()).getTime();
	};

	// Try to fetch the JSON multiple times.
	JSONCache._tryGetJSON = function (url, options, tryNumber, waitTime) {
		if (tryNumber > settings.numTries) {
			log('Tried fetching', tryNumber - 1, 'times already, returning.');
			if (typeof options.ongiveup === 'function') {
				options.ongiveup('timeout');
			}
			return;
		}

		options.error = function (jqXHR, textStatus, errorThrown) {
			log('Ajax error with status:', textStatus);
			if (typeof options.onerror === 'function') {
				options.onerror(jqXHR, textStatus, errorThrown, tryNumber);
			}
			window.setTimeout(function () {
				JSONCache._tryGetJSON(url, options, tryNumber + 1, waitTime * 2);
			}, waitTime);
		};

		if (typeof options.ontry === 'function') {
			options.ontry(tryNumber);
		}

		JSONCache._getJSONProxy(url, options);
	};

	JSONCache.getCachedJSON = function (url, options) {
		options = options || {};
		var success = options.success;

		chrome.storage.local.get({
			eventCacheData: false,
			eventCacheTime: false
		}, function(items) {

			if (items.eventCacheData && cacheItemValid(items.eventCacheTime)) {
				log('Value found in cache for url:', url);
				if (typeof success === 'function') {
					success(JSON.parse(items.eventCacheData));
				}
			} else {

				log('Value not found in cache or cache has expired, fetching data from reddit.');

				// Wrap the success function to cache the data.
				options.success = function (data) {
					log('Fetched data, adding to cache.');
					try {
						addToCache(url, data);
					} catch (e) {
						if (typeof options.ongiveup === 'function') {
							options.ongiveup('addfailure');
							return;
						}
					}
					if (typeof success === 'function') {
						success(data);
					}
				};

				// Assure a json datatype.
				options.dataType = 'json';
				JSONCache._tryGetJSON(url, options, 1, settings.waitTime);
			}

		});
	};

	// Expose the namespace.
	window.JSONCache = JSONCache;

}(jQuery));