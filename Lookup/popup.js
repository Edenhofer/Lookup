/*
Be aware of that slicing data (str.slice) with one arguemente actualĺy not being found
than slice will still work, because the not found arguements equales -1!

SNIPPETS FOR LATER:
<!--
var bkg = chrome.extension.getBackgroundPage();
bkg.callFunction();
-->
*/

// Custom JSLint configurtations
// Allow the use ECMAScript 6 specific syntax, e.g. const
// jshint esnext: true
// Increased sensitivity for warnings if UNCOMMENTED
//"use strict"; var document, chrome, event, console, window;

// Setting up some constants
const max_output_length = 540;
const max_last_queries = 10;

// Store the last queries from previous searches, [0] being the oldest one
var last_queries = [];
// Each row represents one search function in which [0] is the name of the search function itself,
// [1] being the url, [2] being the fetched html-code and [3] being the user readable content
var search_engines;

// On page load function
//
// @global array search_engines
//
// @return
function init() {
    var saves = ["language", "grounding", "input_language", "switcher_grounding", "switcher_ranked_search"];
    var language, grounding, input_language, switcher_grounding, switcher_ranked_search;
    var tmp = "";

    // The chrome.storage call runs in the background and other function do not wait for it to finisch. It is an asynchronous method!
    chrome.storage.sync.get(saves, function (result) {
        if (chrome.runtime.lasError || !result) {
            console.log("[RUNTIME ERROR]: Please consult the support!");
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
        for (i = 0; i < document.getElementById("input_language").options.length; i++) {
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

        var wikipedia_url, duden_url, archwiki_url, google_translate_url, dict_url;
        // Assembling the corresponding URLs
        wikipedia_url = "https://" + language + ".wikipedia.org/wiki/";
        duden_url = "http://www.duden.de/rechtschreibung/";
        if (language == "de") archwiki_url = "https://wiki.archlinux.de/title/";
        else archwiki_url = "https://wiki.archlinux.org/index.php/";
        google_translate_url = "https://translate.google.de/#auto/" + language + "/";
        if ((input_language == "de" && language == "en") || (input_language == "en" && language == "de")) dict_url = "http://www.dict.cc/?s=";
        else if (input_language == language) {
            // Making the german-english translation the default one if input_language and language are the same
            dict_url = "http://www.dict.cc/?s=";
            document.getElementById("tip").innerHTML = "<i><p>Tip: Change the input language for the dictionary.</p></i>";
        }
        else dict_url = "http://" + language + input_language + ".dict.cc/?s=";

        // Defining the search_engines
        if (language == "en") search_engines = [["wikipedia",wikipedia_url,"",""],["dict",dict_url,"",""]];
        if (language == "de") search_engines = [["duden",duden_url,"",""],["wikipedia",wikipedia_url,"",""],["dict",dict_url,"",""]];
        // If no valid language is detected, than the english style will be used
        else search_engines = [["wikipedia",wikipedia_url,"",""],["dict",dict_url,"",""]];

        // If switcher_grounding is true then set the selected search engine to the top of the search_engines array
        if (switcher_grounding === true) {
            // Removing the next occurance of grounding in search_engines to avoid fetching the site twice
            for (i = 0; i < search_engines.length; i++) {
                if (search_engines[i][0].indexOf(grounding) != -1) search_engines.splice(i, 1);
            }
            search_engines.unshift([grounding, eval(grounding + "_url"), "", ""]);
        }

        // In case switcher_ranked_search is NOT true then make the selected search engine the only one in the search_engines array
        if (switcher_ranked_search === false) search_engines = [[grounding, eval(grounding + "_url"), "", ""]];
    });
}

// Strip html elements from the input
//
// @param string html
//
// @return text
function strip_html(html) {
    var text = document.createElement("DIV");
    text.innerHTML = html;
    return text.textContent || text.innerText || "";
}

// Search function for Wikipedia
//
// @param string data: html-code
//
// @return string: User readable content
function wikipedia(data) {
    var begin = -1;
    var end = -1;
    var tmp = "";

    // Stripping tables from data
    data = data.slice(0, data.indexOf("<table")) +  data.slice(data.indexOf("</table>"));

    // Checking for the existance of an article
    if (data.indexOf("<div class=\"noarticletext\">", data.search(new RegExp("<div id=\"mw-content-text\"[^>]*>", "i"))) != -1) begin = -1;
    else {
        data = data.slice(new RegExp("<div id=\"mw-content-text\"[^>]*>", "i"));
        begin = data.indexOf("<p>");
        // Check for interactive boxes where no usefull text is available, e.g. year number - german only
        if (data.slice(begin + 3, begin + 18).localeCompare('<a href="/wiki/') === 0) begin = -1;
    }

    if (begin != -1) {
        end = data.indexOf("</p>", begin);

        // Checking for a list of options
        if (data.indexOf("<li>", end) != -1 && data.indexOf("<li>", end) <= (end + 50)) {
            tmp = data.slice(begin);
            data = data.slice(begin, end);

            // The end is where the second </li> closes
            data += tmp.slice(tmp.indexOf("<li>"), tmp.indexOf("</li>", tmp.indexOf("<li>")) + 5);
            tmp = tmp.slice(tmp.indexOf("</li>", tmp.indexOf("<li>")) + 5);
            if (tmp.indexOf("<li>") != -1 && tmp.indexOf("<li>") <= 50) {
                data += tmp.slice(tmp.indexOf("<li>"), tmp.indexOf("</li>", tmp.indexOf("<li>")) + 5);
            }

            data = data.replace(/<li>/ig, "gorditmp01");
            data = data.replace(/<\/li>/ig, "gorditmp02");
            data += "gorditmp03";
        } else data = data.slice(begin, end);

        // Replacing anything html with nothing
        data = strip_html(data);
        data = data.replace(/\[\d+\]/ig, "");
        data = data.replace(/gorditmp01/ig, "<li>");
        data = data.replace(/gorditmp02/ig, "</li>");
        data = data.replace(/gorditmp03/ig, "<li>...</li>");

        return data;
    }
    else return "none";
}

// Search function for Duden a german dictionary
//
// @param string data: html-code
//
// @return string: User readable content
function duden(data) {
    var begin = -1;
    var end = -1;

    begin = data.indexOf("<span", data.search(new RegExp("span>Bedeutung(en|)<span class=\"helpref woerterbuch_hilfe_bedeutungen\">", "i")));

    if (begin != -1) {
        data = data.slice(begin);
        end = data.search(new RegExp("<(/div>|div|img)", "i"));
        data = data.slice(0, end);

        // Preserve the bullet list but remove remaining html-code
        data = data.replace(/<li id="b2-Bedeutung-[\d\D]"[^>]*>/ig, "gorditmp01");
        data = data.replace(/<li id="b2-Bedeutung-[\d][\D]"[^>]*>/ig, "gorditmp02");
        data = data.replace(/<\/li>/ig, "gorditmp03");
        data = strip_html(data);
        data = data.replace(/gorditmp01/ig, "<ul><li>");
        data = data.replace(/gorditmp02/ig, "<ul><li>");
        data = data.replace(/gorditmp03/ig, "</li></ul>");

        return data;
    }
    else return "none";
}

// Search function for Arch Linux Wiki
//
// @param string data: html-code
//
// @return string: User readable content
function archwiki(data) {
    var begin = -1;
    var end = -1;

    // Checking for the existance of an article
    if (data.indexOf("<div class=\"noarticletext\">", data.search(new RegExp("<div id=\"mw-content-text\"[^>]*>", "i"))) != -1) begin = -1;
    else {
        data = data.slice(new RegExp("<div id=\"mw-content-text\"[^>]*>", "i"));
        begin = data.search(new RegExp("<(|/)div[^>]*>(|\n)<p>"));
    }

    if (begin != -1) {
        end = data.indexOf("</p>", begin);
        // If the article is to short it is probabaly a quotation, then things have to be handled differently
        if (strip_html(data.slice(begin, end)).length < 50) {
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
        else data = data.slice(begin, end);

        // Replacing anything html with nothing
        data = strip_html(data);
        data = data.replace(/\[\d+\]/ig, "");

        // Saving the cursive writing
        data = data.replace(/gorditmp01/ig, "<i>");
        data = data.replace(/gorditmp02/ig, "</i>");

        return data;
    }
    else return "none";
}

// Search function for Google Translate
//
// @param string data: html-code
//
// @return string: User readable content
function google_translate(data) {
    /*
    Works only in theory. The source code which is send to an
    ordinary user by Google differs from that which this
    extension receives by getting the code from Google.
    */
    var begin = data.search(/<span id=result_box/i);

    if (begin != -1) {
        var end = data.indexOf("</span>", data.indexOf("</span>", begin)+7);
        data = data.slice(begin, end);

        // Strip html elements
        data = strip_html(data);

        return data;
    }
    else return "none";
}

// Search function for dict.cc
//
// @param string data: html-code
//
// @return string: User readable content
function dict(data) {
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
        // Removing some headings, e.g. "</div><b>Substantive</b>"
        data = data.replace(/<\/div><b>([^<]*)<\/b>/ig, "");
        // Removing the little gray numbers
        data = data.replace(/<div[^>]*>([\d]+)<\/div>/ig, "");
        // Removing some uneccessary html code
        data = data.replace(/<dfn([^<]+)<\/dfn>/ig, "");
        data = data.replace(/<td class="td7cm(l|r)"><([^<]+)<\/td>/ig, "");

        // Preserving the table elements
        data = data.replace(/<td[^>]*>/ig, "gorditmp01");
        data = data.replace(/<\/td[^>]*>/ig, "gorditmp02");
        data = data.replace(/<tr[^>]*>/ig, "gorditmp03");
        data = data.replace(/<\/tr[^>]*>/ig, "gorditmp04");
        data = data.replace(/<b[^>]*>/ig, "gorditmp05");
        data = data.replace(/<\/b[^>]*>/ig, "gorditmp06");
        data = strip_html(data);
        data = data.replace(/gorditmp01/ig, "<td>");
        data = data.replace(/gorditmp02/ig, "</td>");
        data = data.replace(/gorditmp03/ig, "<tr>");
        data = data.replace(/gorditmp04/ig, "</tr>");
        data = data.replace(/gorditmp05/ig, "<b>");
        data = data.replace(/gorditmp06/ig, "</b>");
        data = "<table>" + data + "</table>";

        // Removing some notes
        data = data.replace(/\[[^(\])]*\]/ig, "");
        //data = data.replace(/{[a-zA-Z.-]+}/ig, ""); <-- TODO Is this really necessary
        data = data.replace(/&lt;([^&]*)&gt;/ig, "");

        return data;
    }
    else return "none";
}

// Fetch the html-code of any page
//
// @global array search_engines
// @param integer i: Row of the search_engines array at which the html-code should be place
// @param string url
//
// @return
function fetch_site(url, i) {
    var xmlhttp = new XMLHttpRequest();
    var event = new Event('display_result');

    // Milliseconds a request can take before automatically being terminated - async only
    xmlhttp.timeout = 5000;
    xmlhttp.ontimeout = function () {
        search_engines[i][2] = "none";
        console.log("ONTIMEOUT: search_engines[" + i + "][2] is now set to " + search_engines[i][2] );
        // Dispatch the magic event
        document.dispatchEvent(event);
    };

    // On error
    xmlhttp.onerror = function () {
        search_engines[i][2] = "none";
        console.log("ONERRROR: search_engines[" + i + "][2] is now set to " + search_engines[i][2] );
        // Dispatch the magic event
        document.dispatchEvent(event);
    };

    // On success
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                search_engines[i][2] = xmlhttp.responseText;
                // Deleting unneccessary spaces
                search_engines[i][2] = search_engines[i][2].trim();
                // Dispatch the event
                document.dispatchEvent(event);
            } else if (xmlhttp.status >= 400) {
                search_engines[i][2] = "none";
                // Dispatch the magic event
                document.dispatchEvent(event);
            }
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

// Process the recieved html-code
//
// @global html-element query
// @global array search_engines
//
// @return
function query_search_process() {
    var tmp = "";
    // Getting the input
    var query = document.getElementById("query").value;

    for (var i = 0; i < search_engines.length; i++) {
        // Only proceed if the current html-code field is properly set
        if (search_engines[i][2] < 4) return;
        else if (search_engines[i][2] == "none" && search_engines[i][3].length < 4) search_engines[i][3] = "none";
        else if (search_engines[i][2] != "none" && search_engines[i][3].length < 4) {
            // Invoke the various functions for further processing of the html-code
            search_engines[i][3] = eval(search_engines[i][0] + "(search_engines[" + i + "][2])");
        }

        // Check whether the output was already set - This is necessary because this function
        // may be invoked simultaneously and therefore the EventListener may not be removed in time
        if (document.getElementById("output").style.display == "inline") return;

        if (search_engines[i][3] == "none" && i == (search_engines.length - 1)) {
            // Nothing was found
            // Stop listening for the magic signal from fetch_site
            document.removeEventListener('display_result');

            // Presenting a Google-Link to look for results
            if (query.length > 20) tmp = query.slice(0, 20) + "...";
            else tmp = query;
            document.getElementById("noresult").innerHTML = "<p>No Match - <a href=\"https://www.google.de/search?q=" +
            encodeURIComponent(query) + "\" target=\"_blank\">Google for \"" +
            tmp.replace(/"/g, "\"").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") + "\"</a></p>";

            // Set what to display
            document.getElementById("loading").style.display="none";
            document.getElementById("noresult").style.display="inline";
        } else if (search_engines[i][3] != "none") {
            // A result was found
            // Stop listening for the magic signal from fetch_site
            document.removeEventListener('display_result');

            // Write "none" as result to all remaining requests
            for (var n = (i + 1); n < search_engines.length; n++) {
                search_engines[n][3] = "none";
            }

            // Trimming the output if it exceeds the maximum length
            if (strip_html(search_engines[i][3]).length >= max_output_length) {
                search_engines[i][3] = search_engines[i][3].slice(0, max_output_length);
                search_engines[i][3] = search_engines[i][3].slice(0, search_engines[i][3].lastIndexOf(" "))+ "...";
            }

            // Filling the various html divisions
            document.getElementById("output").innerHTML = "<p></p>" + search_engines[i][3];
            document.getElementById("source").innerHTML = "<p><span class=\"tab\"></span><i><a href=\"" +
            search_engines[i][1] + encodeURIComponent(query) + "\" target=\"_blank\">" +
            search_engines[i][1] + query + "</a><\i></p>";

            // Set what to display
            document.getElementById("loading").style.display="none";
            document.getElementById("output").style.display="inline";
            document.getElementById("source").style.display="inline";
        }
    }
}

// Initiate the xml requests and display the final result
//
// @global html-element query
// @global array last_queries
// @global array search_engines
//
// @return
function query_search_init() {
    // Getting the input
    var query = document.getElementById("query").value;
    // Break if there is no input
    // THIS MUST BE THE RUN PRIOR TO EXECUTING ANYTHING IN ORDER TO NOT MANIPULATE THE POPUP IF THE QUERY IS INVALID
    if (query === "" || query == " ") return -1;

    // Removing redundant queries in the array (case sensitive) and appending new query
    for (var i = 0; i < last_queries.length; i++) {
        if (last_queries[i].indexOf(query) != -1) last_queries.splice(i, 1);
    }
    last_queries.push(query);
    // Keeping the maximum length of last_queries below max_last_queries
    if (last_queries.length > max_last_queries) last_queries = last_queries.slice(last_queries.length - max_last_queries);
    // Store last_queries locally
    chrome.storage.local.set({'last_queries': last_queries});

    // Set	what to display
    document.getElementById("loading").style.display="inline";
    document.getElementById("output").style.display="none";
    document.getElementById("noresult").style.display="none";
    document.getElementById("source").style.display="none";
    document.getElementById("tip").style.display="none";

    // Filling the loading div with text
    document.getElementById("loading").innerHTML = "<p>Searching in " +
    search_engines.map(function(value,index) { return value[0]; }).toString().replace(/,/g, ", ") + "...<\p>";

    // Listen for the magic signal from fetch_site to process the recieved html-code
    document.addEventListener('display_result', query_search_process);

    // Fetching possible entries from each site
    for (i = 0; i < search_engines.length; i++) {
        // Emptying the html-code and content field of the search_engines array
        search_engines[i][2] = "";
        search_engines[i][3] = "";
        // encodeURIComponent() encodes special characters into URL, therefore replacing the need for a diacritics map
        fetch_site(search_engines[i][1] + encodeURIComponent(query), i);
    }
}

// Adding some EventListeners
window.addEventListener('load', function(evt) {
    // Creating a proper link to the option page
    document.getElementById('options_page').innerHTML = "<a href=\"" +
    chrome.extension.getURL("options.html") +"\" target=\"_blank\">Extension Options</a>";

    // Initialize the popup
    init();

    // Fetching and defining the last_queries
    var history = 0;
    chrome.storage.local.get("last_queries", function (result) {
        if (!result.last_queries) {
            last_queries = [];
            history = 0;
        } else {
            last_queries = result.last_queries;
            history = last_queries.length;
        }
    });

    // Filling the value of query with the currently selected text and initiate the search
    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, function(result) {
        if (!chrome.runtime.lastError && result) {
            document.getElementById("query").value = result[0];

            // Search directly after the button click
            query_search_init();
        }
    });

    // Quickly switch the grounding
    document.getElementById('grounding').addEventListener('change', function () {
        var grounding = document.getElementById("grounding").value;
        chrome.storage.sync.set({'grounding': grounding});

        init();
    });

    // Quickly switch the input_language
    document.getElementById('input_language').addEventListener('change', function () {
        var input_language = document.getElementById("input_language").value;
        chrome.storage.sync.set({'input_language': input_language});

        init();
    });

    // Trigger the search if ENTER or the search-button is pressed
    document.getElementById('search').addEventListener('submit', function () {
        // Prevent the page from reloading after the submit button is triggered
        event.preventDefault();
        query_search_init();
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
