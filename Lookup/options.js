// Until now the function is not calles
function style_display() {
	alert("NOT WORKING THIS WAY!");
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	alert(language);
	
	/* styl.display is not working like this !!!!!!!!!!!!!!!!!!!1
	if (language == "de") document.getElementById("ger_d").style.display = "none";
	else document.getElementById("ger_d").style.display = "inline";
	*/
}

// Saves options to chrome.storage
function save_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	
	chrome.storage.local.set({'language': language, 'grounding': grounding});
	
	document.getElementById("status").innerHTML = "Settings saved.";
	setTimeout(function() {document.getElementById("status").innerHTML = ""}, 1250);
}

// Loading the Settings
function load() {
	var language = "";
	var grounding = "";
	chrome.storage.local.get('language', function (result) {
		language = result.language;
	});


	chrome.storage.local.get('grounding', function (result) {
		grounding = result.grounding;
	});
	
	return(language, grounding);
}

// Setting default options
function default_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;	
}

// Event Listeners
window.addEventListener("load", function(evt) {
	document.getElementById("save").addEventListener("click", save_options);
	document.getElementById("default").addEventListener("click", default_options);
});
