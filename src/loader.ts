import "./style.css";

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
} else {
  import('@/bootstrapper')
}

export {}