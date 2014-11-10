function search() {
	event.preventDefault();
	document.getElementById("loading").innerHTML = "<p>Searching...<\p>";
	
	// Set  what to display
	document.getElementById("loading").style.display="inline";
	document.getElementById("output").style.display="none";
	document.getElementById("noresult").style.display="none";
	document.getElementById("source").style.display="none";
	document.getElementById("tip").style.display="none";
	
	/* This whole Part is Arch Linux specific! --> */
	var grounding = "https://www.archlinux.org/packages/?q="
	/* <-- This whole Part is Arch Linux specific! */
	
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
			
			/* This whole Part is Arch Linux specific! --> */
			begin = data.search(/<table class="results">/i);
			
			if (begin != -1) {
				end = data.indexOf("</table>", begin);
				data = data.slice(begin, end);
				
				// Here was once code, but it became uneccessarry for archlinux_pac
			/* <-- This whole Part is Arch Linux specific! */
											
				document.getElementById("output").innerHTML = "<p></p>" + data;
				document.getElementById("source").innerHTML = "<i><a href=\"" + url
					+ "\" target=\"_blank\">" + url + "</a><\i>";
				
				// Set what to display
				document.getElementById("loading").style.display="none";
				document.getElementById("output").style.display="inline";
				document.getElementById("source").style.display="inline";
			} else {
				document.getElementById("noresult").innerHTML = "<p>We couldn't find any packages matching your query.</p>";
				
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
