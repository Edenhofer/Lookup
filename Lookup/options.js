// Until now the function is not calles
function style_display() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	
	if (language != "de") document.getElementById("ger_d").style.display = "none";
	else document.getElementById("ger_d").style.display = "inline";
}

// Saves options to chrome.storage
function save_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;

	chrome.storage.sync.set({"language": language, "groundning": grounding}, function() {
		//if (runtime.lastError) alert("Unexpected Error");
		// This does not work yet!
		document.getElementById("status").innerHTML = "Settings saved";
		document.getElementById("status").style.display = "inline";
		
		chrome.storage.sync.get(("language", "grounding"), function(language, grounding) {
			alert(language);
		});
	});
}

// Setting default options
function default_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;	
}

window.addEventListener("load", function(evt) {
	document.getElementById("save").addEventListener("submit", save_options);
	document.getElementById("save_default").addEventListener("submit", default_options);
});
