// Until now the function is not calles
function style_display() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	
	if (language == "de") document.getElementById("ger_d").style.display = 'inline';
	else document.getElementById("ger_d").style.display = 'none';
}

// Saves options to chrome.storage
function save_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	
	chrome.storage.sync.set({'language': language, 'grounding': grounding});
	
	document.getElementById("status").innerHTML = "Settings saved.";
	setTimeout(function() {document.getElementById("status").innerHTML = ""}, 1250);
}

// Setting default options
function default_options() {
/*
This button is for later, if there are more settings available!!!!!!!!!!!!!!!!
*/
}

// Setting the init configuration
function init() {
	// Loading the Settings
	var language = "";
	var grounding = "";
	
	chrome.storage.sync.get('language', function (result) {
		if (chrome.runtime.lastError) language = "en";
		else language = result.language;
		
		// Preselecting the saved language
		for (var i = 0; i < document.getElementById("language").options.length; i++) {
			if (document.getElementById("language").options[i].value == language) {
				document.getElementById("language").options[i].selected = true;
				break;
			}
		}
		
		if (language == "de") document.getElementById("ger_d").style.display = 'inline';
		else document.getElementById("ger_d").style.display = 'none';
	});

	chrome.storage.sync.get('grounding', function (result) {
		if (chrome.runtime.lastError) grounding = "wikipedia";
		else grounding = result.grounding;
		
		// Preselecting the saved grounding
		for (var i = 0; i < document.getElementById("grounding").options.length; i++) {
			if (document.getElementById("grounding").options[i].value == grounding) {
				document.getElementById("grounding").options[i].selected = true;
				break;
			}
		}
	});
}

// Donate Popup
function donate() {
	window.open("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=9ZAYWC36LQVZQ&submit.x=35&submit.y=2", "_blank");
	/* !!!!!!!!!!!!!!!!!!!!!! Popup erstellen!
	<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
		<input type="hidden" name="cmd" value="_s-xclick">
		<input type="hidden" name="hosted_button_id" value="9ZAYWC36LQVZQ">
		<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" width=60px height=15px border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
		<img alt="" border="0" src="https://www.paypalobjects.com/de_DE/i/scr/pixel.gif" width="1" height="1">
	</form>
	*/
}

// Event Listeners which are added on load of the page
window.addEventListener("load", function(evt) {
	init();
	document.getElementById("save").addEventListener("click", save_options);
	document.getElementById("default").addEventListener("click", default_options);
	document.getElementById("language").addEventListener("change", style_display);
	document.getElementById("donate").addEventListener("click", donate);
});
