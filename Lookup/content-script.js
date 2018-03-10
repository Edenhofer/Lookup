// Custom JSLint configuration
// Allow the use ECMAScript 6 specific syntax, e.g. const
// jshint esnext: true

// Setting up some constants
const max_output_length = 540;
const pre_html_id = "lookup-infobox-";

document.body.addEventListener('dblclick', function () {
	query = window.getSelection().toString();
	if ((query.length == 1 && query.match(/[\W\d]/)) || query === "") return -1;

	console.log("Your query is '" + query + "'"); // DEBUG message TODO

	// Inject the infobox.html division into the site with an asynchronous function
	var infobox_url = chrome.extension.getURL("infobox.html");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var object = document.createElement("div");
			object.id = pre_html_id + "main-container";
			// Hiding the infobox for now -TODO
			object.style.display = "none";
			object.innerHTML = xmlhttp.responseText;
			document.body.appendChild(object);
		} else if (xmlhttp.readyState == 4 && xmlhttp.status >= 400) {
			console.log("[INTERNAL ERROR]: Could not load the infobox. Please consult the support!");
		}
	};
	xmlhttp.open("GET", infobox_url, true);
	xmlhttp.send();

	chrome.runtime.sendMessage({message: query}, function (response) {
		console.log("[DBCLICK]: \"" + query + "\" - sending message to extension - waiting for a response - " + response.back); // DEBUG text TODO
	});
});

document.body.addEventListener('click', function () {
	if (document.getElementById(pre_html_id + "main-container") !== null) {
		document.body.removeChild(document.getElementById(pre_html_id + "main-container"));
	}
});
