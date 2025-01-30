// Minimal "onceDocumentLoaded" helper
function onceDocumentLoaded(cb) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    cb();
  } else {
    document.addEventListener('DOMContentLoaded', cb);
  }
}

const vscode = acquireVsCodeApi();

// Pull initial config from meta's data-settings
function getSettings() {
  const el = document.getElementById('runway-webview-settings');
  if (!el) {
    throw new Error('No settings element found');
  }
  const data = el.getAttribute('data-settings');
  if (!data) {
    throw new Error('No settings data found');
  }
  return JSON.parse(data);
}

const settings = getSettings();

const iframe = document.querySelector('iframe');
const header = document.querySelector('.header');
const input = header.querySelector('.url-input');
// const forwardButton = header.querySelector('.forward-button');
// const backButton = header.querySelector('.back-button');
const reloadButton = header.querySelector('.reload-button');
const openExternalButton = header.querySelector('.open-external-button');

function simplifyUrl(url) {
  try {
    const urlObj = new URL(url);
    // remove the cache-busting parameter
    urlObj.searchParams.delete('__cacheBuster');
    
    if (urlObj.hostname.includes('webcontainer-api.io')) {
      // beautify the URL
      return 'https://container' + urlObj.pathname + urlObj.search;
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

function restoreUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'container') {
      // Replace the simplified URL with the actual WebContainer URL
      const currentIframeUrl = new URL(iframe.src);
      return currentIframeUrl.origin + urlObj.pathname + urlObj.search;
    }
    return url;
  } catch {
    return url;
  }
}

// Setup focus-lost detection
window.addEventListener('message', e => {
  switch (e.data.type) {
    case 'focus':
      iframe.focus();
      break;
    case 'didChangeFocusLockIndicatorEnabled':
      toggleFocusLockIndicatorEnabled(e.data.enabled);
      break;
  }
});

onceDocumentLoaded(() => {
  // Check if the iframe is focused
  setInterval(() => {
    const iframeFocused = document.activeElement?.tagName === 'IFRAME';
    document.body.classList.toggle('iframe-focused', iframeFocused);
  }, 50);

  // Hooks
  iframe.addEventListener('load', () => {
    // Noop
  });

  input.addEventListener('change', e => {
    const rawUrl = e.target.value;
    const actualUrl = restoreUrl(rawUrl);
    navigateTo(actualUrl);
  });

  // forwardButton.addEventListener('click', () => {
  //   history.forward();
  // });

  // backButton.addEventListener('click', () => {
  //   history.back();
  // });

  openExternalButton.addEventListener('click', () => {
    vscode.postMessage({
      type: 'openExternal',
      url: restoreUrl(input.value)
    });
  });

  reloadButton.addEventListener('click', () => {
    navigateTo(restoreUrl(input.value));
  });

  // initial load
  navigateTo(settings.url);
  input.value = simplifyUrl(settings.url);
  toggleFocusLockIndicatorEnabled(settings.focusLockIndicatorEnabled);
});

function navigateTo(rawUrl) {
  try {
    const url = new URL(rawUrl);
    // force cache skip
    url.searchParams.append('__cacheBuster', Date.now().toString());
    iframe.src = url.toString();
    // update url
    input.value = simplifyUrl(url.toString());
  } catch {
    // If invalid URL, just push rawUrl
    iframe.src = rawUrl;
    input.value = simplifyUrl(rawUrl);
  }

  // save the state
  vscode.setState({ url: rawUrl });
}

function toggleFocusLockIndicatorEnabled(enabled) {
  document.body.classList.toggle('enable-focus-lock-indicator', enabled);
}