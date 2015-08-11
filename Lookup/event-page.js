// Custom JSLint configurtations
// Allow the use ECMAScript 6 specific syntax, e.g. const
// jshint esnext: true

// Setting up some constants
const max_last_queries = 10;
const xmlhttp_timeout = 5000; // in milliseconds

// Each row represents one search function in which [0] is the name of the search function itself,
// [1] being the url, [2] being the fetched html-code and [3] being the user readable content
var search_engines;
// Store the last queries from previous searches, [0] being the oldest one
var last_queries = [];
// The input
var query;

// Handling doucle-click events with the content-script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message) {
        sendResponse({back: "message delivered"}); // DEBUG text TODO

        /*
        query = request.message;

        var saves = ["language", "grounding", "input_language", "switcher_grounding", "switcher_ranked_search", "last_queries"];
        var language, grounding, input_language, switcher_grounding, switcher_ranked_search, last_queries;
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

            search_engines = assemble_search_engines(language, grounding, input_language, switcher_grounding, switcher_ranked_search);

            // Fetching and defining the last_queries
            if (!result.last_queries) last_queries = [];
            else last_queries = result.last_queries;

            // Initiate the search
            lookup.init();
        });
        */
    }
    else console.log("[INTERNAL ERROR]: onMessage Error. Please consult the support!");
});
