import Script from 'next/script';
import "@/../node_modules/vscode-web/dist/out/vs/workbench/workbench.web.main.css";

export const metadata = {
  title: 'Your App Title',
  description: 'Description of your app',
};

export default function Page() {
  return (
    <>
      <Script src="/node_modules/vscode-web/dist/out/vs/loader.js" strategy="beforeInteractive" />
      <Script src="/node_modules/vscode-web/dist/out/vs/webPackagePaths.js" strategy="beforeInteractive" />
      <Script id="configure-vscode-paths" strategy="beforeInteractive">
        {`
            Object.keys(self.webPackagePaths).map(function (key, index) {
              self.webPackagePaths[
                key
              ] = \`\${window.location.origin}/node_modules/vscode-web/dist/node_modules/\${key}/\${self.webPackagePaths[key]}\`;
            });
            require.config({
              baseUrl: \`\${window.location.origin}/node_modules/vscode-web/dist/out\`,
              recordStats: true,
              trustedTypesPolicy: window.trustedTypes?.createPolicy('amdLoader', {
                createScriptURL(value) {
                  return value;
                },
              }),
              paths: self.webPackagePaths,
            });
          `}
      </Script>
      <Script src="/node_modules/vscode-web/dist/out/vs/workbench/workbench.web.main.nls.js" strategy="beforeInteractive" />
      <Script src="/node_modules/vscode-web/dist/out/vs/workbench/workbench.web.main.js" strategy="beforeInteractive" />
      <Script src="/node_modules/vscode-web/dist/out/vs/code/browser/workbench/workbench.js" strategy="beforeInteractive" />
    </>
  );
}
