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
	
	/* This whole Part is Google Translate specific! --> */
	var language = "en";
	var grounding = "https://translate.google.de/#auto/" + language + "/";
	/* <-- This whole Part is Google Translate specific! */
	
	var query = document.getElementById("query").value;
	var url = grounding + query;
	var max_output_length = 540;
	var data = "";
	var begin = -1;
	var end = -1;
	
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
	// request.setRequestHeader('User-Agent','Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1985.125 Safari/537.36');
	request.open("GET", url, true);
	request.send(null);
	request.onreadystatechange = function() {
		if (request.readyState == 4){
			data = request.responseText;
			// Deleting unneccessary spaces
			data = data.trim()
			
			/* This whole Part is Google Translate specific! --> */
			// Funktioniert leider nur in der Theorie, der Source Code, den Google ein schickt ist ein anderer als, der der ein normaler Nutzer bekommt.
			begin = data.search(/<span id=result_box/i);
			
			if (begin != -1) {
				end = data.indexOf("</span>", data.indexOf("</span>", begin)+7);
				data = data.slice(begin, end);
				
				// Replacing anything html with nothing
				data = data.replace(/(<([^>]+)>)/ig, "");
			/* <-- This whole Part is Google Translate specific! */
			
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
