import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET() {
  if (!env.BASE_URL) {
    return NextResponse.json({ error: "BASE_URL env is not set" }, { status: 500 });
  }
  const scheme = env.BASE_URL.startsWith("https") ? "https" : "http";
  // authority is the host and port
  const authority = new URL(env.BASE_URL).host;
  return NextResponse.json(
    {
      productConfiguration: {
        nameShort: "Runway",
        nameLong: "Runway IDE",
        applicationName: "runway-web",
        dataFolderName: ".runway-web",
        version: "1.75.0",
        extensionsGallery: {
          serviceUrl: "https://open-vsx.org/vscode/gallery",
          itemUrl: "https://open-vsx.org/vscode/item",
          resourceUrlTemplate:
            "https://openvsxorg.blob.core.windows.net/resources/{publisher}/{name}/{version}/{path}"
        },
        extensionEnabledApiProposals: {
          "vscode.vscode-web-playground": [
            "fileSearchProvider",
            "textSearchProvider"
          ]
        }
      },
      folderUri: {
        scheme: "memfs",
        path: "/"
      },
      additionalBuiltinExtensions: [
        {
          scheme: scheme,
          authority: authority,
          path: "/extensions/memfs"
        }
      ]
    }
  );
}