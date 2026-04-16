import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { UiProvider } from "@/components/UiProvider";

const raleway = Raleway({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SOW Generator | Datamellon AI",
  description: "Generate professional Statements of Work with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={raleway.className}>
        <UiProvider>{children}</UiProvider>
      </body>
    </html>
  );
}
