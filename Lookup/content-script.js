// Custom JSLint configurtations
// Allow the use ECMAScript 6 specific syntax, e.g. const
// jshint esnext: true

// Setting up some constants
const max_output_length = 540;
const max_last_queries = 10;
const xmlhttp_timeout = 5000; // in milliseconds
const pre_html_id = "lookup-infobox-";

// Each row represents one search function in which [0] is the name of the search function itself,
// [1] being the url, [2] being the fetched html-code and [3] being the user readable content
var search_engines;

document.body.addEventListener('dblclick', function () {
    var query = window.getSelection().toString();
    if ((query.length == 1 && query.match(/[\W\d]/)) || query === "") return -1;

    // Inject the infobox.html division into the site with an asynchronous function
    var infobox_url = chrome.extension.getURL("infobox.html");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var object = document.createElement("div");
            object.id = pre_html_id + "main-container";
            object.style.display = "none"; // Hiding the infobox for now.
            object.innerHTML = xmlhttp.responseText;
            document.body.appendChild(object);
        } else if (xmlhttp.readyState == 4 && xmlhttp.status >= 400) {
            console.log("[INTERNAL ERROR]: Could not load the infobox. Please consult the support!");
        }
    };
    xmlhttp.open("GET", infobox_url, true);
    xmlhttp.send();

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

        search_engines = search_engines = assemble_search_engines(language, grounding, input_language, switcher_grounding, switcher_ranked_search);
    });
});

document.body.addEventListener('click', function () {
    if (document.getElementById(pre_html_id + "main-container") !== null) {
        document.body.removeChild(document.getElementById(pre_html_id + "main-container"));
    }
});
