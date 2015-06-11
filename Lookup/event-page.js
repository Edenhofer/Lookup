// Handling doucle-click events with the content-script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message) {
    sendResponse({back: "message delivered"});
  }
  else console.log("onMessage Error, code:DF7934");
});
