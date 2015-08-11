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
// @param string language
// @param string grounding
// @param string input_language
// @param string switcher_grounding
// @param string switcher_ranked_search
//
// @return array result: The search_engines array
function assemble_search_engines(language, grounding, input_language, switcher_grounding, switcher_ranked_search) {
    var result = "";

    // Defining the result array
    if (language == "en") result = [["wikipedia", engine.wikipedia.url(language, input_language), "", ""],
    ["dict", engine.dict.url(language, input_language), "", ""]];

    else if (language == "de") result = [["duden", engine.duden.url(language, input_language), "", ""],
    ["wikipedia", engine.wikipedia.url(language, input_language), "", ""],
    ["dict", engine.dict.url(language, input_language), "", ""]];

    // If no valid language is detected, than the english style will be used
    else result = [["wikipedia", engine.wikipedia.url(language, input_language), "", ""],
    ["dict", engine.dict.url(language, input_language), "", ""]];

    // If switcher_grounding is true then set the selected search engine to the top of the result array
    if (switcher_grounding === true) {
        // Removing the next occurance of grounding in result to avoid fetching the site twice
        for (i = 0; i < result.length; i++) {
            if (result[i][0].indexOf(grounding) != -1) result.splice(i, 1);
        }
        result.unshift([grounding, engine[grounding].url(language, input_language), "", ""]);
    }

    // In case switcher_ranked_search is NOT true then make the selected search engine the only one in the result array
    if (switcher_ranked_search === false) result = [[grounding, engine[grounding].url(language, input_language), "", ""]];

    return result;
}

var lookup = {
    // Fetch the html-code of any page
    //
    // @global array search_engines
    // @param integer i: Row of the search_engines array at which the html-code should be place
    // @param string url
    //
    // @return
    fetch: function (url, i) {
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
                    // Deleting unneccessary spaces in response text
                    search_engines[i][2] = xmlhttp.responseText.trim();
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
    },

    // Process the recieved html-code
    //
    // @global string query
    // @global array search_engines
    //
    // @return
    process: function () {
        var tmp = "";

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
            if (document.getElementById(pre_html_id + "output").style.display == "inline") return;

            if (search_engines[i][3] == "none" && i == (search_engines.length - 1)) {
                // Nothing was found
                // Stop listening for the magic signal from lookup.fetch
                document.removeEventListener('display_result');

                // Presenting a Google-Link to look for results
                if (query.length > 20) tmp = query.slice(0, 20) + "...";
                else tmp = query;
                document.getElementById(pre_html_id + "noresult").innerHTML = "<p>No Match - <a href=\"https://www.google.de/search?q=" +
                encodeURIComponent(query) + "\" target=\"_blank\">Google for \"" +
                tmp.replace(/"/g, "\"").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") + "\"</a></p>";

                // Set what to display
                document.getElementById(pre_html_id + "loading").style.display="none";
                document.getElementById(pre_html_id + "noresult").style.display="inline";
            } else if (search_engines[i][3] != "none") {
                // A result was found
                // Stop listening for the magic signal from lookup.fetch
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
                document.getElementById(pre_html_id + "output").innerHTML = "<p></p>" + search_engines[i][3];
                document.getElementById(pre_html_id + "source").innerHTML = "<p><span class=\"tab\"></span><i><a href=\"" +
                search_engines[i][1] + encodeURIComponent(query) + "\" target=\"_blank\">" +
                search_engines[i][1] + query + "</a><\i></p>";

                // Set what to display
                document.getElementById(pre_html_id + "loading").style.display="none";
                document.getElementById(pre_html_id + "output").style.display="inline";
                document.getElementById(pre_html_id + "source").style.display="inline";
            }
        }
    },

    // Initiate the xml requests and display the final result
    //
    // @global string query
    // @global array last_queries
    // @global array search_engines
    //
    // @return
    init: function () {
        // Break if there is no input
        // THIS MUST BE THE RUN PRIOR TO EXECUTING ANYTHING IN ORDER TO NOT MANIPULATE THE POPUP IF THE QUERY IS INVALID
        if (query === "" || query == " ") return -1;

        // Removing redundant queries in the array (case sensitive) and appending new query
        for (var i = 0; i < last_queries.length; i++) {
            if (last_queries[i] !== null && last_queries[i].indexOf(query) != -1) last_queries.splice(i, 1);
        }
        last_queries.push(query);
        // Keeping the maximum length of last_queries below max_last_queries
        if (last_queries.length > max_last_queries) last_queries = last_queries.slice(last_queries.length - max_last_queries);
        // Store last_queries locally
        chrome.storage.local.set({'last_queries': last_queries});

        // Set	what to display
        document.getElementById(pre_html_id + "loading").style.display="inline";
        document.getElementById(pre_html_id + "output").style.display="none";
        document.getElementById(pre_html_id + "noresult").style.display="none";
        document.getElementById(pre_html_id + "source").style.display="none";
        document.getElementById(pre_html_id + "tip").style.display="none";

        // Filling the loading div with text
        document.getElementById(pre_html_id + "loading").innerHTML = "<p>Searching in " +
        search_engines.map(function(value,index) { return value[0]; }).toString().replace(/,/g, ", ") + "...<\p>";

        // Listen for the magic signal from lookup.fetch to process the recieved html-code
        document.addEventListener('display_result', lookup.process);

        // Fetching possible entries from each site
        for (i = 0; i < search_engines.length; i++) {
            // Emptying the html-code and content field of the search_engines array
            search_engines[i][2] = "";
            search_engines[i][3] = "";
            // encodeURIComponent() encodes special characters into URL, therefore replacing the need for a diacritics map
            lookup.fetch(search_engines[i][1] + encodeURIComponent(query), i);
        }
    }
};
