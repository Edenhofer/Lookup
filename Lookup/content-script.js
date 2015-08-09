// Custom JSLint configurtations
// Allow the use ECMAScript 6 specific syntax, e.g. const
// jshint esnext: true

// Setting up some constants
const max_output_length = 540;
const max_last_queries = 10;
const xmlhttp_timeout = 5000; // in milliseconds
const pre_html_id = "lookup-infobox-";

document.body.addEventListener('dblclick', function () {
    var query = window.getSelection().toString();
    if ((query.length == 1 && query.match(/[\W\d]/)) || query === "") return -1;

    // Inject the infobox.html division into the site
    var infobox_url = chrome.extension.getURL("infobox.html");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var object = document.createElement("div");
            object.id = pre_html_id + "main-container";
            object.style.display = "none"; // Hiding the infobox for now. - TODO
            object.innerHTML = xmlhttp.responseText;
            document.body.appendChild(object);
        }
    };
    xmlhttp.open("GET", infobox_url, true);
    xmlhttp.send();
});

document.body.addEventListener('click', function () {
    if (document.getElementById(pre_html_id + "main-container") !== null) {
        document.body.removeChild(document.getElementById(pre_html_id + "main-container"));
    }
});
