/*
  Be aware of that slicing data (str.slice) with one arguemente actualĺy not being found
  than slice will still work, because the not found arguements equales -1!

  SNIPPETS FOR LATER:
*/

// Setting up some global variables
var language = "";
var input_language = "";
var query = "";
var last_queries = [];
var search_engines;
var max_output_length = 540;
var max_last_queries = 10;
var data = "";

// On page load function
function init() {
  var grounding = "";
  var switcher_grounding;
  var switcher_ranked_search;
  var saves = ["language", "grounding", "input_language", "switcher_grounding", "switcher_ranked_search"];
  var tmp = "";

  // My guess is that the chrome.storage call runs in the background and that other function do not wait for it to finisch
	chrome.storage.sync.get(saves, function (result) {
	  if (chrome.runtime.lasError || !result) {
	    console.log("Runtime Error, code:FF9932");
	  }
	  // The default values are set here!
		// Getting the language
		if (!result.language) language = "en";
		else language = result.language;
		// Getting the input_language
		if (!result.input_language) input_language = "de";
		else input_language = result.input_language;
		// Getting the grounding
		if (!result.grounding) grounding = "wikipedia";
		else grounding = result.grounding;
		// Getting the switcher_grounding (!variable also checks whether variable is false, so it is necessary to exlude this case)
  	if (!result.switcher_grounding && result.switcher_grounding !== false) switcher_grounding = true;
  	else switcher_grounding = result.switcher_grounding;
  	// Getting the switcher_ranked_search (!variable also checks whether variable is false, so it is necessary to exlude this case)
  	if (!result.switcher_ranked_search && result.switcher_ranked_search !== false) switcher_ranked_search = true;
  	else switcher_ranked_search = result.switcher_ranked_search;

    // Preselecting the saved grounding
		for (var i = 0; i < document.getElementById("grounding").options.length; i++) {
			if (document.getElementById("grounding").options[i].value == grounding) {
				document.getElementById("grounding").options[i].selected = true;
				break;
			}
		}
		// Preselecting the saved input_language
  	for (var i = 0; i < document.getElementById("input_language").options.length; i++) {
  		if (document.getElementById("input_language").options[i].value == input_language) {
  			document.getElementById("input_language").options[i].selected = true;
  			break;
  		}
  	}

  	// Setting what to display
    if (switcher_grounding === true) document.getElementById("grounding").style.display = 'inline';
    else document.getElementById("grounding").style.display = 'none';
    if (switcher_ranked_search === true || grounding == "dict") {
      // Setting up switcher_input_language
	  	document.getElementById("input_language").style.display = 'inline';
	  	// Suppressing the currently selected language as an displayed option of the switcher_input_language
	  	document.getElementById("input_language_" + language).style.display = 'none';
    } else document.getElementById("input_language").style.display = 'none';
    if (!switcher_grounding && !switcher_ranked_search) {
      // Setting the icon
  		document.getElementById("icon").innerHTML = "&nbsp;&nbsp;&nbsp;<img src=\"/icons/"
  			+ grounding + ".png\" alt=\"grounding\" width=\"15\" height= \"15\">";
    		document.getElementById("grounding").style.display = 'none';
  		document.getElementById("icon").style.display = 'inline';
    }

		// Assembling the corresponding URLs
		wikipedia_url = "http://" + language + ".wikipedia.org/wiki/";
		duden_url = "http://www.duden.de/rechtschreibung/";
		if (language == "de") tmp = "de/title";
		// The last option must be "en"
		else tmp = "org/index.php";
		archlinux_url = "https://wiki.archlinux." + tmp + "/";
		google_translate_url = "https://translate.google.de/#auto/" + language + "/";
		if ((input_language == "de" && language == "en") || (input_language == "en" && language == "de")) dict_url = "http://www.dict.cc/?s=";
		else if (input_language == language) {
		  // Making the german-english translation the default one if input_lnaguage and language are the same
		  dict_url = "http://www.dict.cc/?s=";
		  document.getElementById("tip").innerHTML = "<i><p>Tip: Change the input language for the dictionary.</p></i>";
		}
		else dict_url = "http://" + language + input_language + ".dict.cc/?s=";

		// Defining the search_engines
    if (language == "en") search_engines = [["wikipedia",wikipedia_url],["dict",dict_url]];
    if (language == "de") search_engines = [["duden",duden_url],["wikipedia",wikipedia_url],["dict",dict_url]];
    // If no valid language is detected, than the english style will be used
    else search_engines = [["wikipedia",wikipedia_url],["dict",dict_url]];
    // If switcher_grounding is true then set the selected search engine to the top of the search_engines array
    if (switcher_grounding === true) {
      // Removing the next occurance of grounding in search_engines to avoid fetching the site twice
      for (var i = 0; i < search_engines.length; i++)
        if (search_engines[i][0].indexOf(grounding) != -1) search_engines.splice(i, 1);
      search_engines.unshift([grounding, eval(grounding + "_url")]);
    }
    // In case switcher_ranked_search if NOT true then make the selected search engine the only one in the search_engines array
    if (switcher_ranked_search === false) search_engines = [[grounding, eval(grounding + "_url")]];
  });
}

// Function for Wikipedia specific queries
function wikipedia() {
  var begin = -1;
  var end = -1;
  var custom_search;
  var tmp = "";
  // The real query shell not be altered
  var wiki_query = query;

	// Fetching the real name of the query, this is usefull if there is a redirect (e.g. "Eid Mubarak")
	wiki_query = data.slice(data.indexOf("<title>") + 7, data.indexOf("</title>") + 8).replace(new RegExp(" Wiki[^<]*</title>", "i"), "").slice(0, -2);
	// Removing note from the "<title>"-wiki_query e.g. "(Begriffserklärung)"
	if (wiki_query.indexOf("(") != -1) wiki_query = wiki_query.replace(/ ([^)]*)/i, "").slice(0, -1);

  // Searching for the beginning "<p>"
  for (var i = 0; i < 3; i++) {
    custom_search = data.search(new RegExp("[^|][^<]<b>[^<]*" + wiki_query.replace(/ /ig, "[^<]*"), "i"));
    if (custom_search != -1) {
      /*
        Search for '"<b>" + wiki_query' and ignore if spaces are filled with e.g. second names, thereby detect whether it is a timeline
        - this is done by exluding '[^|][^<]' to be the first two characters in front of the search pattern. Then slice the data
        and search for the last occurance of '<p>', because '[^|][^<]' were excluded one has to add 2 to make the search for '<p>'
        beginn at the real begin: the occurance of '"<b>" + wiki_query'.
      */
      begin = data.slice(0, custom_search + 2).lastIndexOf("<p>");
      if (begin != -1) break;
      else data = data.slice(custom_search + wiki_query.length + 3);
    } else {
      begin = -1;
      break;
    }
  }

	if (begin != -1) {
		end = data.indexOf("</p>", begin);
		// Checks whether the <p> ends before the wiki_query was even mentioned (needed for e.g. "1782")
		if (end < custom_search) return -1;

		// Checking for a list of options
		if (data.slice(end + 5, end + 9).localeCompare("<ul>") == 0) {
			tmp = data.slice(begin);
			data = data.slice(begin, end);

			// The end is where the second </li> closes
			data += tmp.slice(tmp.indexOf("<li>"), tmp.indexOf("</li>", tmp.indexOf("<li>")) + 5);
			tmp = tmp.slice(tmp.indexOf("</li>", tmp.indexOf("<li>")) + 5);
			data += tmp.slice(tmp.indexOf("<li>"), tmp.indexOf("</li>", tmp.indexOf("<li>")) + 5);

			data = data.replace(/<li>/ig, "gorditmp01");
			data = data.replace(/<\/li>/ig, "gorditmp02");
			data += "gorditmp03";

			tmp = "";
		} else data = data.slice(begin, end);

		// Replacing anything html with nothing
		data = data.replace(/<[^>]+>/ig, "");
		data = data.replace(/\[\d+\]/ig, "");
		data = data.replace(/gorditmp01/ig, "<li>");
		data = data.replace(/gorditmp02/ig, "</li>");
		data = data.replace(/gorditmp03/ig, "<li>...</li>");

		return 0;
	}
	else return -1;
}

// Function for Duden (german_dictionary) specific queries
function duden() {
  var begin = -1;
  var end = -1;

	begin = data.search(new RegExp("span>Bedeutungen<span class=\"helpref woerterbuch_hilfe_bedeutungen\">", "i")) + 16;
	if (begin != -1) data = data.slice(begin);

	if (begin != 15) {
		end = data.search(new RegExp("<(/div>|div|img)", "i"));
		data = data.slice(0, end);

		// Replacing anything html with nothing
		data = data.replace(/<span class="content">/ig, "gorditmp");
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/gorditmp/ig, "<p></p> -");

		return 0;
	}
	else return -1;
}

// Function for Arch Linux queries
function archlinux() {
  var begin = -1;
  var end = -1;
  var tmp = "";

  // No-Article site
  if (data.indexOf("<div class=\"noarticletext\">", data.search(new RegExp("<div id=\"mw-content-text\"[^>]*>", "i"))) != -1) begin = -1;
	else {
	  data = data.slice(new RegExp("<div id=\"mw-content-text\"[^>]*>", "i"));
	  begin = data.search(new RegExp("<(|/)div[^>]*>(|\n)<p>"));
	}

	if (begin != -1) {
		end = data.indexOf("</p>", begin);
		tmp = data.slice(begin, end);
		// If the article is to short it is probabaly a quotation, then things have to handled differently
		if (tmp.replace(/(<([^>]+)>)/ig, "").length < 50) {
		  data = data.slice(end + 4);
		  begin = data.indexOf("<p>");
		  // Searching for the second closing "</p>"
			end = data.indexOf("</p>", data.indexOf("</p>", begin) + 4);
			if (data.indexOf("<div", data.indexOf("</p>", begin) + 4) < end) end = data.indexOf("<div", data.indexOf("</p>", begin));

      data = data.slice(begin, end);

			// Saving the cursive writing
			data = data.replace(/<i>/ig, "gorditmp01");
			data = data.replace(/<\/i>/ig, "gorditmp02");
		}
		else data = tmp;

		// Replacing anything html with nothing
		data = data.replace(/(<([^>]+)>)/ig, "");
		data = data.replace(/\[\d+\]/ig, "");

		// Saving the cursive writing
		data = data.replace(/gorditmp01/ig, "<i>");
		data = data.replace(/gorditmp02/ig, "</i>");

		return 0;
	}
	else return -1;
}

// Function for Google Translate
function google_translate() {
	/*
	Works only in theory. The source code which is send to an
	ordinary user by Google differs from that which this
	extension receives by getting the code from Google.
	*/
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
  var begin = -1;
  var end = -1;
  var tmp = "";

	begin = data.search(/<tr id='tr1'>/i);

	if (begin != -1) {
		// Searching for the third ocurrance of "</tr>" or the first of "</table>
		end = data.indexOf("</tr>", data.indexOf("</tr>", data.indexOf("</tr>", begin) + 5) + 5) + 5;
		tmp = data.indexOf("</table>", begin);
		if (tmp < end) end = tmp;

		data = data.slice(begin, end);
		data = "<table>" + data + "</table>";

		// Removing some headings, e.g. "</div><b>Substantive</b>"
		data = data.replace(/<\/div><b>([^<]*)<\/b>/ig, "");
		// Removing the little gray numbers
		data = data.replace(/<div[^>]*>([\d]+)<\/div>/ig, "");

		// Removing some uneccessary html code
		data = data.replace(/<dfn([^<]+)<\/dfn>/ig, "");
		data = data.replace(/<td class="td7cm(l|r)"><([^<]+)<\/td>/ig, "");

		// Removing html but not <td> or </td>
		data = data.replace(/<[^t]([^>]+)>/ig, "");
		data = data.replace(/<\/[^t]([^>]*)>/ig, "");

		// Removing some notes
		data = data.replace(/\[[^(\])]*\]/ig, "");
		data = data.replace(/{[a-zA-Z.-]+}/ig, "");
		data = data.replace(/&lt;([^&]*)&gt;/ig, "");

		return 0;
	}
	else return -1;
}

// The main search function
function query_search(step) {
	var current_url = "";
	var tmp = "";

  // Filling the loading div with text
  if (search_engines.length > 1) document.getElementById("loading").innerHTML = "<p>Searching in " + search_engines[step][0] + " (" + (step + 1) + "/" + search_engines.length + ")" + "...<\p>";
  else document.getElementById("loading").innerHTML = "<p>Searching in " + search_engines[step][0] + "...<\p>";

  // Only do the following the first time
  if (step == 0) {
    // Set  what to display
  	document.getElementById("loading").style.display="inline";
  	document.getElementById("output").style.display="none";
  	document.getElementById("noresult").style.display="none";
  	document.getElementById("source").style.display="none";
  	document.getElementById("tip").style.display="none";

    // Getting the input
  	query = document.getElementById("query").value;
  	// Break if there is no input
  	if (query == "" || query == " ") return -1;

    // Replacing special characters in query, this is only neccessary for "dict.cc"
  	// Incomplete character map, for the full version see "https://gist.github.com/yeah/1283961"
  	var diacriticsMap = [
      {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
      {'base':'AE','letters':/[\u00C4\u00C6\u01FC\u01E2]/g},
      {'base':'AO','letters':/[\uA734]/g},
      {'base':'AU','letters':/[\uA736]/g},
      {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
      {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
      {'base':'OE','letters':/[\u00D6\u0152]/g},
      {'base':'OI','letters':/[\u01A2]/g},
      {'base':'OO','letters':/[\uA74E]/g},
      {'base':'OU','letters':/[\u0222]/g},
      {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
      {'base':'UE','letters':/[\u00DC]/g},
      {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
      {'base':'ae','letters':/[\u00E4\u00E6\u01FD\u01E3]/g},
      {'base':'ao','letters':/[\uA735]/g},
      {'base':'au','letters':/[\uA737]/g},
      {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
      {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
      {'base':'oe','letters': /[\u00F6\u0153]/g},
      {'base':'oi','letters':/[\u01A3]/g},
      {'base':'ou','letters':/[\u0223]/g},
      {'base':'ss','letters':/[\u00DF]/g},
      {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
      {'base':'ue','letters':/[\u00FC]/g},
    ];
    for(var i = 0; i < diacriticsMap.length; i++) {
      query = query.replace(diacriticsMap[i].letters, diacriticsMap[i].base);
    }

    // Remember the current query
    last_queries.push(query);
    // Keeping the maximum length of query below max_last_queries
    if (last_queries.length > max_last_queries) last_queries = last_queries.slice(last_queries.length - max_last_queries, last_queries.length);
    // Sync everything locally
    chrome.storage.local.set({'last_queries': last_queries});
    history = last_queries.length;
  }

  // The URL is set in the init() function
	current_url = search_engines[step][1] + query;

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4){
			data = xmlhttp.responseText;
			// Deleting unneccessary spaces
			data = data.trim();

			if (eval(search_engines[step][0] + "()") == 0) {
				// Trimming the output to not exceed the maximum length
				if (data.replace(/(<([^>]+)>)/ig, "").length >= max_output_length) {
					data = data.slice(0, max_output_length);
					data = data.slice(0, data.lastIndexOf(" "))+ "...";
				}

				document.getElementById("output").innerHTML = "<p></p>" + data;
				document.getElementById("source").innerHTML = "<p><span class=\"tab\"></span><i><a href=\"" + current_url
					+ "\" target=\"_blank\">" + current_url + "</a><\i></p>";

	  		// Set what to display
	  		document.getElementById("loading").style.display="none";
	  		document.getElementById("output").style.display="inline";
	  		document.getElementById("source").style.display="inline";
  		} else if (step == (search_engines.length - 1)) {
		  // No Match Case
		  	// Presenting a Google-Link to look for results
		  	if (query.length > 20) tmp = query.slice(0, 20) + "...";
		  	else tmp = query;
		  	document.getElementById("noresult").innerHTML = "<p>No Match - <a href=\"https://www.google.de/search?q="
		  		+ query.replace("\"", "%22").replace(/<[^>]+>/ig, "") + "\" target=\"_blank\">Google for \"" + tmp + "\"</a></p>";

				// Set what to display
				document.getElementById("loading").style.display="none";
				document.getElementById("noresult").style.display="inline";
			} else {
			  step++;
			  query_search(step);
			}
		}
	};
	xmlhttp.open("GET", current_url, true);
	xmlhttp.send();
}

// Adding some EventListeners
window.addEventListener('load', function(evt) {
  document.getElementById('options_page').innerHTML = "<a href=\"" + chrome.extension.getURL("options.html") +"\" target=\"_blank\">Extension Options</a>";

  // The variable "history" is needed for skipping through old queries
  var history = 0;
  // Fetching and defining the last_queries
  chrome.storage.local.get("last_queries", function (result) {
    if (!result.last_queries) {
      last_queries = [];
      history = 0;
    } else {
  	  last_queries = result.last_queries;
  	  history = last_queries.length;
  	}
  });

  init();

  // Filling the value of #query (the search bar) with the currently selected text
	chrome.tabs.executeScript({
			code: "window.getSelection().toString();"
		}, function(result) {
			if (!chrome.runtime.lastError || result !== undefined) {
				document.getElementById("query").value = result[0];
				query = result[0];

				// Search directly after the button click
				query_search(0);
			}
	});

  // Function for quickly switching the grounding
	document.getElementById('grounding').addEventListener('change', function () {
	  grounding = document.getElementById("grounding").value;
  	chrome.storage.sync.set({'grounding': grounding});

  	init();
	});

	// Function for quickly switching the input_language
	document.getElementById('input_language').addEventListener('change', function () {
	  input_language = document.getElementById("input_language").value;
	  chrome.storage.sync.set({'input_language': input_language});

	  init();
	});

  // Trigger the search if ENTER or the search-button is pressed
	document.getElementById('search').addEventListener('submit', function () {
	  // Prevent the page from reloading after the submit button is triggered
		event.preventDefault();
		query_search(0);
	});

	document.onkeydown = function(event) {
	  var code = event.keyCode;
	  if (!event) event = window.event;
    if (event.charCode && code == 0) code = event.charCode;

    if (code == 37 || code == 40) {
    // 37: Key left; 40: Key down
      event.preventDefault();
	    if (history == last_queries.length) last_queries.push(document.getElementById('query').value);

      if (history > 0) history -= 1;
      document.getElementById('query').value = last_queries[history];
      document.getElementById('query').select();
      console.log("[DOWN](" + history + "): " + last_queries[history] + " out of " + last_queries);
    } else if (code == 38 || code == 39) {
    // 38: Key up; 39: Key right
      event.preventDefault();
	    if (history == last_queries.length) last_queries.push(document.getElementById('query').value);

      if (history < last_queries.length - 1) history += 1;
      document.getElementById('query').value = last_queries[history];
      document.getElementById('query').select();
      console.log("[UP](" + history + "): " + last_queries[history] + " out of " + last_queries);
    }
	};
});

// Handling doucle-click events with the content-script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  alert("message received");
});