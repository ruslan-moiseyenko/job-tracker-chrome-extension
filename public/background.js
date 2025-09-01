// Background script to handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Replace with your desired URL
  const targetUrl = "https://example.com"; // Change this to your target page

  // Open the URL in a new tab
  chrome.tabs.create({ url: targetUrl });
});
