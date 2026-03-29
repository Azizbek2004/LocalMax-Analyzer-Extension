/**
 * Background Service Worker
 * Handles message routing and tab management for LocalMax Analyzer.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'OPEN_ANALYSIS_TAB') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('analysis.html'),
        });
        sendResponse({ success: true });
    }

    if (message.type === 'GET_GAME_DATA') {
        chrome.storage.session.get(['analysisGame', 'sourceUrl', 'sourceSite', 'timestamp'], (data) => {
            sendResponse(data);
        });
        return true; // async response
    }

    if (message.type === 'CLEAR_GAME_DATA') {
        chrome.storage.session.remove(['analysisGame', 'sourceUrl', 'sourceSite', 'timestamp']);
        sendResponse({ success: true });
    }

    return false;
});

// Extension install / update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[LocalMax] Extension installed');
        // Could open onboarding tab here
    }
});

export { };
