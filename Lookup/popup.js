/*
Be aware of that slicing data (str.slice) with one arguemente actualĺy not being found
than slice will still work, because the not found arguements equales -1!

SNIPPETS FOR LATER:
<!--
var bkg = chrome.extension.getBackgroundPage();
bkg.callFunction();
-->

<!--
function fetch_feed(url, callback) {
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function(data) {
if (xhr.readyState == 4) {
if (xhr.status == 200) {
var data = xhr.responseText;
callback(data);
} else {
callback(null);
}
}
}
// Note that any URL fetched here must be matched by a permission in
// the manifest.json file!
xhr.open('GET', url, true);
xhr.send();
}



function onRequest(request, sender, callback) {
if (request.action == 'fetch_feed') {
fetch_feed(request.url, callback);
}
}
-->
*/
// Making JSLint display a lot more warning
// "use strict";
// var document, chrome, event, console, window;

// Setting up some global variables
var last_queries = [];
var search_engines;
var max_output_length = 540;
var max_last_queries = 10;

// On page load function
function init() {
  var saves = ["language", "grounding", "input_language", "switcher_grounding", "switcher_ranked_search"];
  var language, grounding, input_language, switcher_grounding, switcher_ranked_search;
  var tmp = "";

  // The chrome.storage call runs in the background and other function do not wait for it to finisch. It is an asynchronous method!
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
    for (var n = 0; i < document.getElementById("input_language").options.length; i++) {
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
      document.getElementById("icon").innerHTML = "&nbsp;&nbsp;&nbsp;<img src=\"/icons/" + grounding + ".png\" alt=\"grounding\" width=\"15\" height= \"15\">";
      document.getElementById("grounding").style.display = 'none';
      document.getElementById("icon").style.display = 'inline';
    }

    var wikipedia_url, duden_url, archlinux_url, google_translate_url, dict_url;
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
      for (var k = 0; i < search_engines.length; i++)
      if (search_engines[i][0].indexOf(grounding) != -1) search_engines.splice(i, 1);
      search_engines.unshift([grounding, eval(grounding + "_url")]);
    }
    // In case switcher_ranked_search if NOT true then make the selected search engine the only one in the search_engines array
    if (switcher_ranked_search === false) search_engines = [[grounding, eval(grounding + "_url")]];
  });
}

// Function for Wikipedia specific queries
function wikipedia(data, query) {
  var begin = -1;
  var end = -1;
  var custom_search;
  var tmp = "";

  // Fetching the real name of the query, this is usefull if there is a redirect (e.g. "Eid Mubarak")
  query = data.slice(data.indexOf("<title>") + 7, data.indexOf("</title>") + 8).replace(new RegExp(" Wiki[^<]*</title>", "i"), "").slice(0, -2);
  // Removing note from the "<title>"-query e.g. "(Begriffserklärung)"
  if (query.indexOf("(") != -1) query = query.replace(/ ([^)]*)/i, "").slice(0, -1);

  // Searching for the beginning "<p>"
  for (var i = 0; i < 3; i++) {
    custom_search = data.search(new RegExp("[^|][^<]<b>[^<]*" + query.replace(/ /ig, "[^<]*"), "i"));
    if (custom_search != -1) {
      /*
      Search for '"<b>" + query' and ignore if spaces are filled with e.g. second names, thereby detect whether it is a timeline
      - this is done by exluding '[^|][^<]' to be the first two characters in front of the search pattern. Then slice the data
      and search for the last occurance of '<p>', because '[^|][^<]' were excluded one has to add 2 to make the search for '<p>'
      beginn at the real begin: the occurance of '"<b>" + query'.
      */
      begin = data.slice(0, custom_search + 2).lastIndexOf("<p>");
      if (begin != -1) break;
      else data = data.slice(custom_search + query.length + 3);
    } else {
      begin = -1;
      break;
    }
  }

  if (begin != -1) {
    end = data.indexOf("</p>", begin);
    // Checks whether the <p> ends before the query was even mentioned (needed for e.g. "1782")
    if (end < custom_search) return -1;

    // Checking for a list of options
    if (data.slice(end + 5, end + 9).localeCompare("<ul>") === 0) {
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

    return data;
  }
  else return "none";
}

// Function for Duden (german_dictionary) specific queries
function duden(data, query) {
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

    return data;
  }
  else return "none";
}

// Function for Arch Linux queries
function archlinux(data, query) {
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

    return data;
  }
  else return "none";
}

// Function for Google Translate
function google_translate(data, query) {
  /*
  Works only in theory. The source code which is send to an
  ordinary user by Google differs from that which this
  extension receives by getting the code from Google.
  */
  var begin = data.search(/<span id=result_box/i);

  if (begin != -1) {
    var end = data.indexOf("</span>", data.indexOf("</span>", begin)+7);
    data = data.slice(begin, end);

    // Replacing anything html with nothing
    data = data.replace(/(<([^>]+)>)/ig, "");

    return data;
  }
  else return "none";
}

// Function for dict.cc
function dict(data, query) {
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

    return data;
  }
  else return "none";
}

// This function is used to fetch the html-code of any page
function fetch_site(url) {
  var data = "";
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        data = xmlhttp.responseText;
        // Deleting unneccessary spaces
        data = data.trim();
      } else data = "none";

      alert("data: " + data); // TODO
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

// The main search function
function query_search() {
  // Getting the input
  var query = document.getElementById("query").value;
  // Break if there is no input - THIS MUST BE THE RUN PRIOR TO EXECUTING ANYTHING IN ORDER TO NOT MANIPULATE THE POPUP IF THE QUERY IS INVALID
  if (query === "" || query == " ") return -1;

  var tmp = "";
  var site = [];

  // Remember the current query
  last_queries.push(query);
  // Keeping the maximum length of query below max_last_queries
  if (last_queries.length > max_last_queries) last_queries = last_queries.slice(last_queries.length - max_last_queries, last_queries.length);
  // Sync everything locally
  chrome.storage.local.set({'last_queries': last_queries});

  // Set	what to display
  document.getElementById("loading").style.display="inline";
  document.getElementById("output").style.display="none";
  document.getElementById("noresult").style.display="none";
  document.getElementById("source").style.display="none";
  document.getElementById("tip").style.display="none";

  // fetching possible entries from each site
  // "search_engines" is set in the init() function
  // encodeURIComponent() encodes special characters into URL, therefore replacing the need for a diacritics map
  for (i = 0; i < search_engines.length - 1; i++)
    site.push(fetch_site(search_engines[i][1] + encodeURIComponent(query)));

  // TODO
  var gordi = fetch_site("http:edh.ddns.net");
  alert("Hallo || " + search_engines[i][1] + query + " || ");
  alert(gordi);
  //alert(site[0] + "||" + site[1]);

  // Do nothing (special) until every single html-request has finished
  for (i = 0; i < search_engines.length - 1; i++) {
    // Filling the loading div with text
    if (search_engines.length > 1) document.getElementById("loading").innerHTML = "<p>Searching in " + search_engines[i][0] + " (" + (i + 1) + "/" + search_engines.length + ")" + "...<\p>";
    else document.getElementById("loading").innerHTML = "<p>Searching in " + search_engines[i][0] + "...<\p>";

    // I GET STUCK IN THE WHILE LOOP NOT INTENTIONALLY!!!!!!! TODO
    while (!site[i]) {
    }
  }

  for (i = 0; i < search_engines.length - 1; i++) {
    tmp = site[i];
    //site[i] = eval(search_engines[i][0] + "(" + eval(tmp) + ", " +  eval(query) + ")");
    site[i] = eval(search_engines[i][0] + "(tmp, query)");
    if (site[i] == "none") continue;
    else if (site[i]) {
      // Trimming the output to not exceed the maximum length
      if (site[i].replace(/(<([^>]+)>)/ig, "").length >= max_output_length) {
        site[i] = site[i].slice(0, max_output_length);
        site[i] = site[i].slice(0, site[i].lastIndexOf(" "))+ "...";
      }

      document.getElementById("output").innerHTML = "<p></p>" + site[i];
      document.getElementById("source").innerHTML = "<p><span class=\"tab\"></span><i><a href=\"" + search_engines[i][1] + "\" target=\"_blank\">" + search_engines[i][1] + "</a><\i></p>";

      // Set what to display
      document.getElementById("loading").style.display="none";
      document.getElementById("output").style.display="inline";
      document.getElementById("source").style.display="inline";

      // A result was found and was succesfully display, hence breaking out of the loop
      if (site[i] != "none") break;
    }

    if (i >= search_engines.length - 1) {
      // There if no search_engine anymore available and nothing was found
      // Presenting a Google-Link to look for results
      if (query.length > 20) tmp = query.slice(0, 20) + "...";
      else tmp = query;
      document.getElementById("noresult").innerHTML = "<p>No Match - <a href=\"https://www.google.de/search?q=" + query.replace("\"", "%22").replace(/<[^>]+>/ig, "") + "\" target=\"_blank\">Google for \"" + tmp + "\"</a></p>";

      // Set what to display
      document.getElementById("loading").style.display="none";
      document.getElementById("noresult").style.display="inline";
    }
  }
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
    if (!chrome.runtime.lastError && result) {
      document.getElementById("query").value = result[0];

      // Search directly after the button click
      query_search();
    }
  });

  // Function for quickly switching the grounding
  document.getElementById('grounding').addEventListener('change', function () {
    var grounding = document.getElementById("grounding").value;
    chrome.storage.sync.set({'grounding': grounding});

    init();
  });

  // Function for quickly switching the input_language
  document.getElementById('input_language').addEventListener('change', function () {
    var input_language = document.getElementById("input_language").value;
    chrome.storage.sync.set({'input_language': input_language});

    init();
  });

  // Trigger the search if ENTER or the search-button is pressed
  document.getElementById('search').addEventListener('submit', function () {
    // Prevent the page from reloading after the submit button is triggered
    event.preventDefault();
    query_search();
  });

  // Navigating through history with the arrow keys
  document.onkeydown = function(event) {
    var code = event.keyCode;
    if (!event) event = window.event;
    if (event.charCode && code === 0) code = event.charCode;

    // NOTE: 37: Key left; 39: Key right
    if (code == 40) {
      // 40: Key down
      event.preventDefault();
      if (history == last_queries.length) last_queries.push(document.getElementById('query').value);

      if (history > 0) history -= 1;
      document.getElementById('query').value = last_queries[history];
      document.getElementById('query').select();
      console.log("[DOWN](" + history + "): " + last_queries[history] + " out of " + last_queries);
    } else if (code == 38) {
      // 38: Key up
      event.preventDefault();
      if (history == last_queries.length) last_queries.push(document.getElementById('query').value);

      if (history < last_queries.length - 1) history += 1;
      document.getElementById('query').value = last_queries[history];
      document.getElementById('query').select();
      console.log("[UP](" + history + "): " + last_queries[history] + " out of " + last_queries);
    }
  };
});
