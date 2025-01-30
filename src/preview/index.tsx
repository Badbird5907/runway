import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client'

import './index.css'

const PREVIEW_CHANNEL = 'preview-updates';

// Add global styles to ensure full viewport coverage
const styles = `
  html, body, #preview-container {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`;

const WebContainerPreview = ({ previewId }: { previewId: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Handle preview refresh
  const handleRefresh = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      // Force a clean reload
      iframeRef.current.src = '';
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl;
        }
      });
    }
  }, [previewUrl]);

  useEffect(() => {
    // Initialize broadcast channel
    broadcastChannelRef.current = new BroadcastChannel(PREVIEW_CHANNEL);

    // Listen for preview updates
    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.previewId === previewId) {
        if (event.data.type === 'refresh-preview' || event.data.type === 'file-change') {
          handleRefresh();
        }
      }
    };

    // Construct the WebContainer preview URL
    const url = `https://${previewId}.local-credentialless.webcontainer-api.io`;
    setPreviewUrl(url);

    // Set the iframe src
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    // Cleanup
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [previewId, handleRefresh]);

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <iframe
        ref={iframeRef}
        title="WebContainer Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
        allow="cross-origin-isolated"
        loading="eager"
      />
    </div>
  );
}

const beginPreview = (id: string) => {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);

  // get the body tag and append <div id="preview-container">
  const body = document.body;
  const previewContainer = document.createElement("div");
  previewContainer.id = "preview-container";
  body.appendChild(previewContainer);

  // render the react component into the preview container
  createRoot(previewContainer).render(<WebContainerPreview previewId={id} />);
}

export default beginPreview