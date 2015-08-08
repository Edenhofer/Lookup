/*
Tipp: Keep in mind slicing data (str.slice) with one arguemente actualĺy not being found
than slice will still work, because the not found arguements equales -1!
*/

// Custom JSLint configurtations
// Allow the use ECMAScript 6 specific syntax, e.g. const
// jshint esnext: true
// Increased sensitivity for warnings if UNCOMMENTED
//"use strict"; var document, chrome, event, console, window;

// Setting up some constants
const max_output_length = 540;
const max_last_queries = 10;
const xmlhttp_timeout = 5000; // in milliseconds

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

        // Defining the search_engines array
        if (language == "en") search_engines = [["wikipedia", engine.wikipedia.url(language, input_language), "", ""],
        ["dict", engine.dict.url(language, input_language), "", ""]];

        else if (language == "de") search_engines = [["duden", engine.duden.url(language, input_language), "", ""],
        ["wikipedia", engine.wikipedia.url(language, input_language), "", ""],
        ["dict", engine.dict.url(language, input_language), "", ""]];

        // If no valid language is detected, than the english style will be used
        else search_engines = [["wikipedia", engine.wikipedia.url(language, input_language), "", ""],
        ["dict", engine.dict.url(language, input_language), "", ""]];

        // If switcher_grounding is true then set the selected search engine to the top of the search_engines array
        if (switcher_grounding === true) {
            // Removing the next occurance of grounding in search_engines to avoid fetching the site twice
            for (i = 0; i < search_engines.length; i++) {
                if (search_engines[i][0].indexOf(grounding) != -1) search_engines.splice(i, 1);
            }
            search_engines.unshift([grounding, engine[grounding].url(language, input_language), "", ""]);
        }

        // In case switcher_ranked_search is NOT true then make the selected search engine the only one in the search_engines array
        if (switcher_ranked_search === false) search_engines = [[grounding, engine[grounding].url(language, input_language), "", ""]];
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
    xmlhttp.timeout = xmlhttp_timeout;
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
            // Invoke the various search engines for further processing of the html-code
            search_engines[i][3] = engine[search_engines[i][0]].innerText(search_engines[i][2]);
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

    // Loading the groundings
    for (var current in engine) {
        document.getElementById("grounding").innerHTML += "<option value=\"" + current + "\" id=\"" + current + "\">" + engine[current].info[1] + "</option>";
    }

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
