// Background service worker for PixelCode AI Copilot

chrome.runtime.onInstalled.addListener(() => {
  console.log("PixelCode AI Copilot installed.");
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ANALYZE_WEBSITE") {
    // Handle API requests here securely
    console.log("Received website data:", request.payload);
    
    // Simulate API call delay
    setTimeout(() => {
      sendResponse({ status: "success", data: "Analysis complete (mock)" });
    }, 1000);
    
    return true; // Keep the message channel open for async response
  }
});
