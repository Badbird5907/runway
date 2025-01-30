import "./style.css";

console.log("-> react-loader", window.location.pathname)
if (window.location.pathname.startsWith('/webcontainer/preview/')) {
  const id = window.location.pathname.split('/').pop()
  if (id) {
    const beginPreview = await import('./preview')
    beginPreview.default(id)
  } else {
    window.location.href = '/'
  }
} else if (window.location.pathname.startsWith('/webcontainer/connect/')) {
  const beginConnect = await import('./preview/connect')
  beginConnect.default()
}

export {}