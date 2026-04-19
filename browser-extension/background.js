const HOME = 'https://forsion.net/';

function isBlankTab(url) {
  if (!url) return true;
  if (url === 'about:blank') return true;
  if (url.startsWith('chrome://newtab')) return true;
  if (url.startsWith('edge://newtab')) return true;
  if (url.startsWith('chrome-extension://') && url.includes('newtab.html')) return true;
  return false;
}

async function openHomeOnce() {
  const windows = await chrome.windows.getAll({ populate: true });
  if (windows.length === 0) {
    await chrome.windows.create({ url: HOME, focused: true });
    return;
  }

  for (const win of windows) {
    const tabs = win.tabs || [];
    const target = tabs.find((t) => isBlankTab(t.url) || isBlankTab(t.pendingUrl));
    if (target) {
      await chrome.tabs.update(target.id, { url: HOME, active: true });
      await chrome.windows.update(win.id, { focused: true });
      return;
    }
  }

  const [firstWindow] = windows;
  await chrome.tabs.create({ windowId: firstWindow.id, url: HOME, active: true });
  await chrome.windows.update(firstWindow.id, { focused: true });
}

chrome.runtime.onStartup.addListener(() => {
  openHomeOnce().catch((err) => console.error('[Forsion Launcher] onStartup failed', err));
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: HOME }).catch(() => {});
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: HOME }).catch(() => {});
});
