/* IS NOT WORKING WITH ÖÄÜ!!!!!!!!!!!!!!!!!!!!!! (current_url is correct) !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
// Setting up the variables
var query = "";
var language = "";
var grounding = "";
var url = "";
var max_output_length = 540;
var data = "";
var begin = -1;
var end = -1;

// On page load function
function init() {
	// My guess is that the chrome.storage call runs in the background and that other function do not wait for it to finisch
	chrome.storage.sync.get('switcher_grounding', function (result) {
		// Getting the switcher_grounding
		if (chrome.runtime.lastError || result.switcher_grounding === undefined) switcher_grounding = true;
		else switcher_grounding = result.switcher_grounding;
	});
	
	chrome.storage.sync.get('language', function (result) {
		// Getting the language
		if (chrome.runtime.lastError || typeof result.language === 'undefined') language = "en";
		else language = result.language;
		
		if (language == "de") document.getElementById("ger_d").style.display = 'inline';
		else document.getElementById("ger_d").style.display = 'none';
	});
	
	chrome.storage.sync.get('input_language', function (result) {
		// Getting the input_language
		if (chrome.runtime.lastError || typeof result.input_language === 'undefined') input_language = "de";
		else input_language = result.input_language;
		
		// Preselecting the saved input_language
		for (var i = 0; i < document.getElementById("input_language").options.length; i++) {
			if (document.getElementById("input_language").options[i].value == input_language) {
				document.getElementById("input_language").options[i].selected = true;
				break;
			}
		}
	});

	chrome.storage.sync.get('grounding', function (result) {
		// Getting the grounding
		if (chrome.runtime.lastError || typeof result.grounding === 'undefined') grounding = "wikipedia";
		else grounding = result.grounding;
		
		// Preselecting the saved grounding
		for (var i = 0; i < document.getElementById("grounding").options.length; i++) {
			if (document.getElementById("grounding").options[i].value == grounding) {
				document.getElementById("grounding").options[i].selected = true;
				break;
			}
		}
		
		// Putting together the first part of the url containing the language and grounding
		if (grounding == "wikipedia") url = "http://" + language + ".wikipedia.org/wiki/";
		else if (grounding == "ger_d") url = "http://www.duden.de/rechtschreibung/";
		else if (grounding == "archlinux") {
			if (language == "de") language = "de/title";
			// The last option must be "en"
			else language = "org/index.php";
			url = "https://wiki.archlinux." + language + "/";
		} 
		else if (grounding == "google_translate") url = "https://translate.google.de/#auto/" + language + "/";
		else if (grounding == "dict") {
			// Dict.cc only works with english and german
			if (language == "de" || language == "en") {
				if ((input_language == "de" && language == "en") || (input_language == "en" && language == "de")) url = "http://www.dict.cc/?s=";
				else if (input_language == language) url = "";
				else url = "http://" + language + input_language + ".dict.cc/?s=";
			} else url = "";
		} else {
			url = "";
			grounding = "";
			return;
		}
		
		// Setting the icon
		if (grounding != "") {
			document.getElementById("icon").innerHTML = "&nbsp;&nbsp;&nbsp;<img src=\"/icons/" + grounding + ".png\" alt=\"grounding\" width=\"15\" height= \"15\">";
		}
		
		// Setting up the quick grounding switcher
		if (switcher_grounding === true) {
			document.getElementById("grounding").style.display = 'inline';
			document.getElementById("icon").style.display = 'none';
			
			// Setting up switcher_input_language
			if (grounding == "dict") document.getElementById("input_language").style.display = 'inline';
			else document.getElementById("input_language").style.display = 'none';
		} else {
			document.getElementById("grounding").style.display = 'none';
			document.getElementById("icon").style.display = 'inline';	
		}
	});
	
	// Filling the value of #query (the search bar) with the currently selected text
	chrome.tabs.executeScript({
			code: "window.getSelection().toString();"
		}, function(result) {
			if (!chrome.runtime.lastError || result !== undefined) {
				document.getElementById("query").value = result[0];
				query = result[0];
				
				// Search directly after the button click (not working!!!!!!!!!)
				query_search();
			}
	});
}

// Function for quickly switching the grounding
function switcher_grounding() {
	grounding = document.getElementById("grounding").value;
	chrome.storage.sync.set({'grounding': grounding});
	
	if (grounding == "dict") document.getElementById("input_language").style.display = 'inline';
	else document.getElementById("input_language").style.display = 'none';
	
	init();
}

// Function for quickly switching the input_language
function switcher_input_language() {
	input_language = document.getElementById("input_language").value;
	chrome.storage.sync.set({'input_language': input_language});
	
	init();
}

// Function for Wikipedia specific queries
function wikipedia() {
	begin = data.search(new RegExp("<p>[^<]*(<i>|)<b>" + query, "i"));
	
	if (begin != -1) {
		end = data.indexOf("</p>", begin);
				
		// Checking for a list of options
		if (data.slice(end - 1, end) == ":") {
			// End is where the second checkpoint ends
			end = data.indexOf("</li>", data.indexOf("</li>", begin) + 5);
			data = data.slice(begin, end);
			data = data.replace(/<li>/ig, "gorditemp01");
			data = data.replace(/<\/li>/ig, "gorditemp02");
			data += "gorditemp03";
		} else data = data.slice(begin, end);
		
		// Replacing anything html with nothing
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/\[\d+\]/ig, "");
		data = data.replace(/gorditemp01/ig, "<li>");
		data = data.replace(/gorditemp02/ig, "</li>");
		data = data.replace(/gorditemp03/ig, "<li>...</li>");
		
		return 0;
	}	
	else return -1;			
}

// Function for Duden (german_dictionary) specific queries
function ger_d() {
	begin = data.search(new RegExp("(</span>Bedeutung|span>Bedeutungen)<span class=\"helpref woerterbuch_hilfe_bedeutungen\">", "i")) + 16;
	data = data.slice(begin);
	
	if (begin != 15) {
		end = data.search(new RegExp("<(/div>|div|img)", "i"), begin);
		data = data.slice(0, end);
		
		// Replacing anything html with nothing
		data = data.replace(/<span class="content">/ig, "gorditemp");
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/gorditemp/ig, "<p></p> -");
		
		return 0;
	}
	else return -1;
}

// Function for Arch Linux queries
function archlinux() {
	begin = data.toLowerCase().indexOf("<!-- start content -->");
	if (data.toLowerCase().indexOf("<div class=\"noarticletext\">", begin) != -1) begin = -1;
	else begin = data.toLowerCase().indexOf("</div>", begin);
	
	if (begin != -1) {
		// German Arch Linux wiki entrys starts on the third "</div>"
		if (language == "de/title") {
			begin = data.toLowerCase().indexOf("</div>", begin + 6);
			begin = data.toLowerCase().indexOf("</div>", begin + 6);
		}
		
		end = data.indexOf("</p>", begin);
		var temp = data.slice(begin, end);
		if (temp.replace(/(<([^>]+)>)/ig, "").length < 50) {
			end = data.indexOf("</p>", data.indexOf("</p>", begin) + 4);
			if (data.indexOf("<div", data.indexOf("</p>", begin) + 4) < end) end = data.indexOf("<div", data.indexOf("</p>", begin));
			
			// Saving the cursive writing
			data = data.replace(/<i>/ig, "gorditemp01");
			data = data.replace(/<\/i>/ig, "gorditemp02");
			
			data = data.slice(begin, end);
		}
		else data = temp
		
		// Replacing anything html with nothing
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/\[\d+\]/ig, "");
		
		// Saving the cursive writing
		data = data.replace(/gorditemp01/ig, "<i>");
		data = data.replace(/gorditemp02/ig, "</i>");
		
		return 0;
	}
	else return -1;
}

// Function for Google Translate
function g_translate() {
	/* Funktioniert leider nur in der Theorie.
	Der Source Code, den Google einen schickt ist ein anderer als,
	der, der ein normaler Nutzer bekommt. !!!!!!!!!!!!!!!*/
	begin = data.search(/<span id=result_box/i);
	
	if (begin != -1) {
		end = data.indexOf("</span>", data.indexOf("</span>", begin)+7);
		data = data.slice(begin, end);
	
		// Replacing anything html with nothing
		data = data.replace(/(<([^>]+)>)/ig, "");
		
		return 0;
	}
	else return -1;
}

// Function for dict.cc
function dict() {
	begin = data.search(/<tr id='tr1'>/i);
	
	if (begin != -1) {
		// Searching for the second orrance of "</tr>"
		end = data.indexOf("</tr>", data.indexOf("</tr>", begin) + 5) + 5;
		data = data.slice(begin, end);
		
		data = "<table>" + data + "</table>";
		
		// Replacing some uneccessary html code with nothing
		data = data.replace(/<td class="td7cm(l|r)"><([^<]+)<\/td>/ig, "");
		
		// Removing html but not <td> or </td>
		data = data.replace(/<[^t]([^>]+)>/ig, "");
		data = data.replace(/<\/[^t]([^d]*)>/ig, "");
		
		// Removing some notes
		data = data.replace(/([\d]+)/ig, "");		
		data = data.replace(/\[[^(\])]*\]/ig, "");
		data = data.replace(/{[a-zA-Z.]+}/ig, "");
		data = data.replace(/&lt;([^&]*)&gt;/ig, "");
		
		return 0;
	}	
	else return -1;			
}

// The main search function
function query_search() {
	event.preventDefault();
	var current_url = "";
	
	// Getting the input
	query = document.getElementById("query").value;
	
	// Break if there is no input
	if (query == "") return;
	
	// Replacing special characters in query (NOT WORKING !!!!!!!!!!!!!!!!!!!)
	query = query.replace(/ä/ig, "%C3%B6");
	query = query.replace(/ö/ig, "%C3%A4");
	query = query.replace(/ü/ig, "%C3%BC");
	//alert(query);
	
	// The Url is set in the init() function
	current_url = url + query;
	
	// Filling the loading div with text
	document.getElementById("loading").innerHTML = "<p>Searching...<\p>";
	
	// Set  what to display
	document.getElementById("loading").style.display="inline";
	document.getElementById("output").style.display="none";
	document.getElementById("noresult").style.display="none";
	document.getElementById("source").style.display="none";
	document.getElementById("tip").style.display="none";
	
	function makeHttpObject() {
		try {return new XMLHttpRequest();}
		catch (error) {}
		try {return new ActiveXObject("Msxml2.XMLHTTP");}
		catch (error) {}
		try {return new ActiveXObject("Microsoft.XMLHTTP");}
		catch (error) {}
		throw new Error("Could not create HTTP request object.");
	}

	var request = makeHttpObject();
	request.open("GET", current_url, true);
	request.send(null);
	request.onreadystatechange = function() {
		if (request.readyState == 4){
			data = request.responseText;
			// Deleting unneccessary spaces
			data = data.trim();
			
			//alert(data); !!!!!!!!!!!!!!!!!!!
			if (eval(grounding+"()") == 0) {			
				// Trimming the output to not exceed the maximum length
				if (data.length >= max_output_length) data = data.slice(0, max_output_length) + "..."
				
				document.getElementById("output").innerHTML = "<p></p>" + data;
				document.getElementById("source").innerHTML = "<i><a href=\"" + current_url
					+ "\" target=\"_blank\">" + current_url + "</a><\i>";
				
				// Set what to display
				document.getElementById("loading").style.display="none";
				document.getElementById("output").style.display="inline";
				document.getElementById("source").style.display="inline";
			} else {
			// No Match Case
				// Presenting a Google-Link to look for results
				if (query.length > 20) temp = query.slice(0, 20) + "...";
				else temp = query;
				document.getElementById("noresult").innerHTML = "<p>No Match - <a href=\"https://www.google.de/search?q="
					+ query.replace("\"", "%22") + "\" target=\"_blank\">Google for \"" + temp + "\"</a></p>";
				
				// Set  what to display
				document.getElementById("loading").style.display="none";
				document.getElementById("noresult").style.display="inline";
			}			
		}
	};	
}

// Adding some EventListeners and one starup function (init())
window.addEventListener('load', function(evt) {
	init();
	document.getElementById('grounding').addEventListener('change', switcher_grounding);
	document.getElementById('input_language').addEventListener('change', switcher_input_language);
	document.getElementById('search').addEventListener('submit', query_search);
});
