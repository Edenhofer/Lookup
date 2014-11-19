/* Modified version of http://stackoverflow.com/questions/13804213/how-can-i-capture-events-triggered-on-an-extension-icon
// Set click to false at beginning
var alreadyClicked = false;
// Declare a timer variable
var timer;

// Add Default Listener provided by chrome.api.*
chrome.browserAction.onClicked.addListener(function (tab) {
	// Check for previous click
	if (alreadyClicked) {
		// Clear timer already set in earlier Click
		clearTimeout(timer);
		console.log("Double click");

		// Doubleclick DO STH:
		alert("Doubleclick");

		// Clear all Clicks
		alreadyClicked = false;
		return;
	}

	alreadyClicked = true;

	// Add a timer to detect next click to a sample of 250
	timer = setTimeout(function () {
		// No more clicks so, this is a single click
		console.log("Single click");

		// Singleclick DO STH:
		alert("Singleclick");

		// Clear all timers
		clearTimeout(timer);

		// Ignore clicks
		alreadyClicked = false;
	}, 250);
});
*/
