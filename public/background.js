/// <reference types="chrome"/>

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openModal") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleModal"});
    });
  }
}); 