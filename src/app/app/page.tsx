"use client";

import dynamic from "next/dynamic";

const IDEApp = dynamic(() => import("@/ide/app"), { ssr: false });
export default function App() {
  return <IDEApp />;
}