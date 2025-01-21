export function generateProductConfig() {
  return {
    productConfiguration: {
      // ... existing configuration ...
    },
    folderUri: {
      scheme: "memfs",
      path: "/"
    },
    additionalBuiltinExtensions: [
      {
        scheme: "https",
        authority: `${import.meta.env.VITE_SERVER_HOST || 'localhost'}:${import.meta.env.VITE_SERVER_PORT || '7581'}`,
        path: "/extensions/memfs"
      }
    ]
  };
} 