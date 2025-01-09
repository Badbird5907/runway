import { WebContainerProvider } from "@/components/container";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WebContainerProvider>{children}</WebContainerProvider>;
}
