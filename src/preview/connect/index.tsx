import { createRoot } from "react-dom/client";

import "../../../node_modules/@vscode/codicons/dist/codicon.css"
import "./index.css"

// TODO: rewrite this when I eventually switch this to remix or something.
const BeginConnect = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Connect WebContainer</h1>
      <span className="text-lg">Oops! You went to the wrong URL!</span>
      <span className="text-lg">
        Please head back to your editor and click the 
        {" "}
        <div className="codicon codicon-link-external"></div>
        {" "}
        button!
      </span>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 hover:cursor-pointer transition-all duration-300" onClick={() => {
        // close the window
        window.close()
      }}>
        OK
      </button>
    </div>
  )
}

const beginConnect = () => {
  const body = document.body;
  const connectContainer = document.createElement("div");
  connectContainer.id = "root";
  body.appendChild(connectContainer);

  createRoot(connectContainer).render(<BeginConnect />);
}
export default beginConnect