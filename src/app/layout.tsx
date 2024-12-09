import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DeveloperProvider } from "@/contexts/DeveloperContext";
import ContextProvider from "@/contexts/ContextProvider";
import { headers } from "next/headers";
import Script from "next/script";
import { ContractProvider } from "@/contexts/ContractProvider";
import { WagmiProvider } from "wagmi";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Request Agents",
  description: "Manage and interact with your AI-powered agents effortlessly using the Request Agents platform. Customize, chat, and get insights tailored to your needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = headers().get('cookie')
  return (
    <html lang="en">
    <head>
    {/* <Script id="chatbot" data-agent-id="67500d5fd8f7b664f8bc39e8" data-account-id={"0xFf43E33C40276FEEff426C5448cF3AD9df6b5741"} src="https://script-sepia.vercel.app/ChatBot.js"></Script> */}
    </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
            {/* <Script id="chatbot" data-agent-id="67500d5fd8f7b664f8bc39e8" data-account-id={"0xFf43E33C40276FEEff426C5448cF3AD9df6b5741"} src="https://script-sepia.vercel.app/ChatBot.js"></Script> */}
       
        <ContextProvider cookies={cookies}>
        <ContractProvider>
          <DeveloperProvider>
            {children}
          </DeveloperProvider>
          </ContractProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
