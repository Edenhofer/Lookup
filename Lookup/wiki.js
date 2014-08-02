// Getting the input
var query = document.getElementById("query").value

// Loading the settings and defining the url
var url = load() + query;

// Defining some other variables
var max_output_length = 540
var data = "";
var begin = -1;
var end = -1;

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
	
	if (grounding == "wikipedia") return "http://" + language + ".wikipedia.org/wiki/";
	if (grounding == "ger_d") return "http://www.duden.de/rechtschreibung/";
	if (grounding == "archlinux") {
		if (language == "en") language = "org/index.php";
		if (language == "de") language = "de/title";
		else {
			alert("Error Code: aaa01"); 
			return "";
		}
		return "https://wiki.archlinux." + language + "/";
	} 
	if (grounding == "google_translate") return "https://translate.google.de/#auto/" + language + "/";
	else return "";
}

// Function for Wikipedia specific queries
function wikipedia() {
	/* Is this needed? !!!!!!!!!!!!!!!!!!!!!!!
	var begin =  window.begin;
	var query = window.query;
	var end = window.end;
	var data = window.data;
	*/
	
	begin = data.search(new RegExp("<p>[a-zA-Z0-9_ ]*<b>" + query, "i"));
	
	if (begin != -1) {
		end = data.indexOf("</p>", begin);
		data = data.slice(begin, end);
		
		// Replacing anything html with nothing
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/\[\d+\]/ig, "");
		
		return 0;
	}	
	else return -1;			
}

// Function for Duden specific queries
function duden() {
	begin = data.search(/(<\/span>Bedeutung|span>Bedeutungen)<span class="helpref woerterbuch_hilfe_bedeutungen">/i) + 16;
			
	if (begin != 15) {
		end = data.indexOf("</div>", begin);
		data = data.slice(begin, end);
		
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
		end = data.indexOf("</p>", begin);
		temp = data.slice(begin, end);
		if (temp.replace(/(<([^>]+)>)/ig, "").length < 50) {
			end = data.indexOf("</p>", data.indexOf("</p>", begin) + 4);
			data = data.replace(/<i>/ig, "gorditemp01");
			data = data.replace(/<\/i>/ig, "gorditemp02");
			data = data.slice(begin, end);
		}
		else data = temp
		
		// Replacing anything html with nothing
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/\[\d+\]/ig, "");
		data = data.replace(/gorditemp01/ig, "<i>");
		data = data.replace(/gorditemp02/ig, "</i>");
		
		return 0;
	}
	else return -1;
}

// Function for Google Translate
function g_translate() {
	/* !!!!!!!!!!!!!!!!!!!Funktioniert leider nur in der Theorie,
	der Source Code, den Google ein schickt ist ein anderer als,
	der der ein normaler Nutzer bekommt. */
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

function search() {
	event.preventDefault();

	// Break if there is no input
	if (document.getElementById("query").value == "") return;
	
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
	request.open("GET", url, true);
	request.send(null);
	request.onreadystatechange = function() {
		if (request.readyState == 4){
			data = request.responseText;
			// Deleting unneccessary spaces
			data = data.trim()
			
			// This must be automated!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			if (wikipedia() == 0) {			
				// Trimming the output to not exceed the maximum length
				if (data.length >= max_output_length) data = data.slice(0, max_output_length) + "..."
				
				document.getElementById("output").innerHTML = "<p></p>" + data;
				document.getElementById("source").innerHTML = "<i><a href=\"" + url
					+ "\" target=\"_blank\">" + url + "</a><\i>";
				
				// Set what to display
				document.getElementById("loading").style.display="none";
				document.getElementById("output").style.display="inline";
				document.getElementById("source").style.display="inline";
			} else {
				document.getElementById("noresult").innerHTML = "<p>No Match</p>";
				
				// Set  what to display
				document.getElementById("loading").style.display="none";
				document.getElementById("noresult").style.display="inline";
			}			
		}
	};	
}

window.addEventListener('load', function(evt) {
	document.getElementById('search').addEventListener('submit', search);
});
