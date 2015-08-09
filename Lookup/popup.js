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
const pre_html_id = "";

// Store the last queries from previous searches, [0] being the oldest one
var last_queries = [];
// Each row represents one search function in which [0] is the name of the search function itself,
// [1] being the url, [2] being the fetched html-code and [3] being the user readable content
var search_engines;
// The input
var query;

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
        for (var i = 0; i < document.getElementById(pre_html_id + "grounding").options.length; i++) {
            if (document.getElementById(pre_html_id + "grounding").options[i].value == grounding) {
                document.getElementById(pre_html_id + "grounding").options[i].selected = true;
                break;
            }
        }
        // Preselecting the saved input_language
        for (i = 0; i < document.getElementById(pre_html_id + "input_language").options.length; i++) {
            if (document.getElementById(pre_html_id + "input_language").options[i].value == input_language) {
                document.getElementById(pre_html_id + "input_language").options[i].selected = true;
                break;
            }
        }

        // Setting what to display
        if (switcher_grounding === true) document.getElementById(pre_html_id + "grounding").style.display = 'inline';
        else document.getElementById(pre_html_id + "grounding").style.display = 'none';
        if (switcher_ranked_search === true || grounding == "dict") {
            // Setting up switcher_input_language
            document.getElementById(pre_html_id + "input_language").style.display = 'inline';
            // Suppressing the currently selected language as an displayed option of the switcher_input_language
            document.getElementById(pre_html_id + "input_language_" + language).style.display = 'none';
        } else document.getElementById(pre_html_id + "input_language").style.display = 'none';
        if (!switcher_grounding && !switcher_ranked_search) {
            // Setting the icon
            document.getElementById(pre_html_id + "icon").innerHTML = "&nbsp;&nbsp;&nbsp;<img src=\"/icons/" + grounding + ".png\" alt=\"grounding\" width=\"15\" height= \"15\">";
            document.getElementById(pre_html_id + "grounding").style.display = 'none';
            document.getElementById(pre_html_id + "icon").style.display = 'inline';
        }

        search_engines = assemble_search_engines(language, grounding, input_language, switcher_grounding, switcher_ranked_search);
    });
}

// Adding some EventListeners
window.addEventListener('load', function(evt) {
    // Creating a proper link to the option page
    document.getElementById(pre_html_id + 'options_page').innerHTML = "<a href=\"" +
    chrome.extension.getURL("options.html") +"\" target=\"_blank\">Extension Options</a>";

    // Loading the groundings
    for (var current in engine) {
        document.getElementById(pre_html_id + "grounding").innerHTML += "<option value=\"" + current + "\" id=\"" + current + "\">" + engine[current].info[1] + "</option>";
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
            query = result[0];
            document.getElementById(pre_html_id + "query").value = query;
            // Search directly after the button click
            lookup.init();
        }
    });

    // Quickly switch the grounding
    document.getElementById(pre_html_id + 'grounding').addEventListener('change', function () {
        var grounding = document.getElementById(pre_html_id + "grounding").value;
        chrome.storage.sync.set({'grounding': grounding});

        init();
    });

    // Quickly switch the input_language
    document.getElementById(pre_html_id + 'input_language').addEventListener('change', function () {
        var input_language = document.getElementById(pre_html_id + "input_language").value;
        chrome.storage.sync.set({'input_language': input_language});

        init();
    });

    // Trigger the search if ENTER or the search-button is pressed
    document.getElementById(pre_html_id + 'search').addEventListener('submit', function () {
        // Prevent the page from reloading after the submit button is triggered
        event.preventDefault();
        query = document.getElementById(pre_html_id + "query").value;
        lookup.init();
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
            if (history == last_queries.length) last_queries.push(document.getElementById(pre_html_id + 'query').value);

            if (history > 0) history -= 1;
            document.getElementById(pre_html_id + 'query').value = last_queries[history];
            document.getElementById(pre_html_id + 'query').select();
            console.log("[DOWN](" + history + "): " + last_queries[history] + " out of " + last_queries);
        } else if (code == 38) {
            // 38: Key up
            event.preventDefault();
            if (history == last_queries.length) last_queries.push(document.getElementById(pre_html_id + 'query').value);

            if (history < last_queries.length - 1) history += 1;
            document.getElementById(pre_html_id + 'query').value = last_queries[history];
            document.getElementById(pre_html_id + 'query').select();
            console.log("[UP](" + history + "): " + last_queries[history] + " out of " + last_queries);
        }
    };
});
