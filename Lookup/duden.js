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
	
	/* This whole Part is Duden specific! --> */
	var grounding = "http://www.duden.de/rechtschreibung/"
	/* <-- This whole Part is Duden specific! */
	
	var query = document.getElementById("query").value
	var url = grounding + query;
	var max_output_length = 540
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
	request.open("GET", url, true);
	request.send(null);
	request.onreadystatechange = function() {
		if (request.readyState == 4){
			data = request.responseText;
			// Deleting unneccessary spaces
			data = data.trim()
			
			/* This whole Part is Duden specific! --> */
			begin = data.search(/(<\/span>Bedeutung|span>Bedeutungen)<span class="helpref woerterbuch_hilfe_bedeutungen">/i) + 16;
			
			if (begin != 15) {
				end = data.indexOf("</div>", begin);
				data = data.slice(begin, end);
				
				// Replacing anything html with nothing
				data = data.replace(/<span class="content">/ig, "gorditemp");
				data = data.replace(/(<([^>]+)>)/ig, "");
				data = data.replace(/gorditemp/ig, "<p></p> -");
			/* <-- This whole Part is Duden specific! */
			
				// Trimming the output to not exceed the maximum length
				if (data.length >= max_output_length) data = data.slice(0, max_output_length) + "..."
				
				document.getElementById("output").innerHTML = "<p></p>" + data;
				document.getElementById("source").innerHTML = "<p></p><i><a href=\"" + url
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
