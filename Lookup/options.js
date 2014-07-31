// Saves options to chrome.storage
function save_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	chrome.storage.sync.set({
		language: language,
		grounding: groundning
		}, function() {
			// Update status to let user know options were saved.
			var status = document.getElementById("status");
			status.innerHTML = "Options saved.";
			setTimeout(function() {
				status.textContent = "";
			}, 750);
		}
	);
}
function default_options() {
	var language = document.getElementById("language").value;
	var grounding = document.getElementById("grounding").value;
	chrome.storage.sync.set({
		language: language,
		grounding: groundning
		}, function() {
			// Update status to let user know options were saved.
			var status = document.getElementById("status");
			status.innerHTML = "Options saved.";
			setTimeout(function() {
				status.textContent = "";
			}, 750);
		}
	);
}
// Restore selected preferences
function restore_options() {
	chrome.storage.sync.get({
		language: "de",
		grounding: "wikipedia"
	}, function(items) {
		document.getElementById("language").value = items.language;
		document.getElementById("grounding").value = items.groundning;
	});
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("submit", save_options);
document.getElementById("restore").addEventListener("submit", default_options);
