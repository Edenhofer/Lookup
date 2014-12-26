document.body.addEventListener('dblclick', function () {
  var query = window.getSelection().toString();
  if (query == "" || query == " ") return -1;

  console.log("dbclick: \"" + window.getSelection().toString() + "\"; sending message to extension");
  chrome.runtime.sendMessage("hello", function(response) {
    console.log(response.back);
  });
});