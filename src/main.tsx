import { initLocaleLoader } from 'monaco-editor-wrapper/vscode/locale';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorLanguageClientWrapper, TextChanges } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { configure } from './config.js';
import { configurePostStart } from './common.js';

import '../public/index.css';

await initLocaleLoader();

export const runApplicationPlaygroundReact = async () => {
    const onTextChanged = (textChanges: TextChanges) => {
        console.log(`Dirty? ${textChanges.isDirty}\ntext: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
    };
    const configResult = configure();
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    const App = () => {
        return (
            <div style={{ 'backgroundColor': '#1f1f1f' }}>
                <MonacoEditorReactComp
                    wrapperConfig={configResult.wrapperConfig}
                    onTextChanged={onTextChanged}
                    onLoad={async (wrapper: MonacoEditorLanguageClientWrapper) => {
                        await configurePostStart(wrapper, configResult);
                    }}
                    onError={(e) => {
                        console.error(e);
                    }} />
            </div>
        );
    };
    root.render(
        <StrictMode>
            <App />
        </StrictMode>  
    )
};

runApplicationPlaygroundReact();

// import './index.css'
// import App from './App.tsx'

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
