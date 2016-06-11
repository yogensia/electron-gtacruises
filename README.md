# r/GTAV_Cruises Events Chrome Extension

This is a Chrome Extension port of the Events widget in [r\_GTAV\_Cruises](https://www.reddit.com/r/Gtav_cruises).

It puts an icon in Chrome's toolbar to open the Events widget and notifies you when cruises are about to start.


## Install

You can [add the extension from the Chrome Store](https://chrome.google.com/webstore/detail/rgtavcruises-extension/bnmgigkjikbelbgpflbgedefjiaolfbe).

This will keep you up to date with new versions automatically.


## Pack it yourself

The code is mainly JavaScript. If you know JS you can fork or download this repository, edit it and load or pack the extension yourself from the Extensions page in Chrome.


## Features

- **All the original functionality of the userscript version:** Shows events in your time zone, with countdown timers, etc.
- **Toolbar Icon:** The events widget is now accessible from Chrome's toolbar. The icon shows the number of found cruises.
- **Notifications:** As long as Chrome is open, you'll get toast notifications in your desktop when a cruise is about to start. These notifications can be disabled.
- **Heavily Optimized:** Instead of using a hidden iframe, events are now fetched via JSON. This is faster because it downloads less irrelevant data and uses only one web request.
- **Cache:** Events are cached for 5 minutes, which reduces requests to reddit's servers and improves performance even further, especially if you open the menu seveal times in a couple of minutes.


## What happens under the hood

For those who are interested, the script does the following (and ONLY the following):

1. Fetch event data via [reddit's search page JSON request](https://www.reddit.com/r/GTAV_Cruises/search.json?q=flair%3A%22events%22&restrict_sr=on&sort=new&t=all).

2. Parse through the event titles and urls.

3. For each event found, break up the title line for all necessary information, then perform calculations on the dates/times/etc to convert the event time(s) and date(s) to true UTC time.

4. Compares the future epoch of that UTC time to the current UTC epoch, which creates a difference, and uses that as the countdown. Countdowns are updated once per minute.

In a background process the script also checks for events that are starting in 30 or 15 minutes, and sends a desktop notification using Google Chrome. This process also checks for new events every 15 minutes.


## Notes for event hosts

**NOTE - If you are hosting an event, your event title MUST follow this pattern:**

**[Region] | [Date] | [Title] | [GMT] | [Time]**

* **DATE:** Must be in day/month/year format (ex: 17/8/2015 for August 17, 2015) **DO NOT USE** month/day/year, or written out like, "August 17th 2015".

* **GMT Timezone:** Please post in GMT format (ex: GMT4). The script will also convert PST/PDT/CST/CDT/EST/EDT/AEST/AEDT, but if you use those, you MUST use the right one. If you use PST yet pacific time is currently in PDT, your event will show as 1-hour off.

* **TIME:** Please use 24 hour time. The script will do its best to convert 12 hour format to 24, but just use 24 hour to mitigate edge case issues.

* The script does have other fixes to attempt to resolve human formatting errors, but plase follow these guideline to minimize possible issues. **The most important thing is to always use day/month/year for your date.**

## Credits

Events widget originally coded by [Syntax](https://github.com/JustinHowe).
UI designed by [Yogensia](https://github.com/Yogensia). Updates made by [qlimax5000](https://github.com/qlimax5000) & [Johninatoooor](https://www.reddit.com/user/Johninatoooor).

Further updates, optimization, and port to Chrome Extension by [Yogensia](https://github.com/Yogensia).

## License

### The MIT License (MIT)

#### Copyright (c) 2016 Yogensia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.**