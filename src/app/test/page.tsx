import Script from 'next/script';
import "@/../node_modules/vscode-web/dist/out/vs/workbench/workbench.web.main.css";

export const metadata = {
  title: "Runway IDE",
  description: "Runway IDE",
};

export default function Page() {
  return (
    <>
      <Script src="/vscode/dist/out/vs/loader.js" strategy="beforeInteractive" />
      <Script src="/vscode/dist/out/vs/webPackagePaths.js" strategy="beforeInteractive" />
      <Script id="configure-vscode-paths" strategy="beforeInteractive">
        {`
            Object.keys(self.webPackagePaths).map(function (key, index) {
              self.webPackagePaths[
                key
              ] = \`\${window.location.origin}/vscode/dist/node_modules/\${key}/\${self.webPackagePaths[key]}\`;
            });
            require.config({
              baseUrl: \`\${window.location.origin}/vscode/dist/out\`,
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
      <Script src="/vscode/dist/out/vs/workbench/workbench.web.main.nls.js" strategy="beforeInteractive" />
      <Script src="/vscode/dist/out/vs/workbench/workbench.web.main.js" strategy="beforeInteractive" />
      <Script src="/vscode/dist/out/vs/code/browser/workbench/workbench.js" strategy="beforeInteractive" />
    </>
  );
}
