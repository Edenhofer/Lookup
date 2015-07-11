document.body.addEventListener('dblclick', function () {
    var query = window.getSelection().toString();
    if (query === "" || query == " " || query == ".") return -1;

    chrome.runtime.sendMessage({message: query}, function (response) {
        console.log("[DBCLICK]: \"" + window.getSelection().toString() + "\" - sending message to extension - waiting for a response - " + response.back);
    });
});
