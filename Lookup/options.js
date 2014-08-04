// Hiding language specific groundings
function style_display_language() {
	var language = document.getElementById("language").value;
	var input_language = document.getElementById("input_language").value;
	
	if (language == "de") document.getElementById("ger_d").style.display = 'inline';
	else document.getElementById("ger_d").style.display = 'none';
	
	if (language == "de" || language == "en") {
		document.getElementById("input_language_section").style.display = 'inline';
		document.getElementById("input_language").style.display = 'inline';
	}else {
		document.getElementById("input_language_section").style.display = 'none';
		document.getElementById("input_language").style.display = 'none';
	}
	
	// Warning the user if the same values for "language" and "input_language" are selected
	if (language == input_language) {
		document.getElementById("warning").innerHTML = "The values of \"Language\" and \"Input Language\" should be different.<br><br>";
	} else document.getElementById("warning").innerHTML = "";
}

// Saves options to chrome.storage
function save_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	var input_language = document.getElementById("input_language").value;
	var switcher_grounding = document.getElementById("switcher_grounding").checked;
	
	// Saving the selected options
	chrome.storage.sync.set({'language': language, 'grounding': grounding, 'input_language': input_language, 'switcher_grounding': switcher_grounding});
	
	// Displaying a message for a fixed time
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
	// Setting up the variables
	var language = "";
	var grounding = "";
	var input_language = "";
	var switcher_grounding = "";
	
	// Getting and restoring the language
	chrome.storage.sync.get('language', function (result) {
		if (chrome.runtime.lastError || typeof result.language === 'undefined') language = "en";
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

	// Getting and restoring the grounding
	chrome.storage.sync.get('grounding', function (result) {
		if (chrome.runtime.lastError || typeof result.grounding === 'undefined') grounding = "wikipedia";
		else grounding = result.grounding;
		
		// Preselecting the saved grounding
		for (var i = 0; i < document.getElementById("grounding").options.length; i++) {
			if (document.getElementById("grounding").options[i].value == grounding) {
				document.getElementById("grounding").options[i].selected = true;
				break;
			}
		}
	});
	
	// Getting and restoring the input_language
	chrome.storage.sync.get('input_language', function (result) {
		if (chrome.runtime.lastError || typeof result.input_language === 'undefined') input_language = "en";
		else input_language = result.input_language;
		
		// Preselecting the saved input_language
		for (var i = 0; i < document.getElementById("input_language").options.length; i++) {
			if (document.getElementById("input_language").options[i].value == input_language) {
				document.getElementById("input_language").options[i].selected = true;
				break;
			}
		}
		
		// Warning the user if the same values for "language" and "input_language" are selected
		if (language == input_language) {
			document.getElementById("warning").innerHTML = "The values of \"Language\" and \"Input Language\" should be different.<br><br>";
		} else document.getElementById("warning").innerHTML = "";
	});
	
	// Getting and restoring the switcher_grounding
	chrome.storage.sync.get('switcher_grounding', function (result) {
		if (chrome.runtime.lastError || typeof result.switcher_grounding === 'undefined') switcher_grounding = false;
		else switcher_grounding = result.switcher_grounding;
		
		// Preselecting the saved switcher_grounding
		if (switcher_grounding === true) document.getElementById("switcher_grounding").checked = true;
		else if (switcher_grounding === false) document.getElementById("switcher_grounding").checked = false;
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

// Event Listeners which are added on load of the page and getting the init() function ready, which will start when the page is opened
window.addEventListener("load", function(evt) {
	init();
	document.getElementById("save").addEventListener("click", save_options);
	document.getElementById("default").addEventListener("click", default_options);
	document.getElementById("language").addEventListener("change", style_display_language);
	document.getElementById("input_language").addEventListener("change", style_display_language);
	document.getElementById("donate").addEventListener("click", donate);
});
