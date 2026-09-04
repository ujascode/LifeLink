import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: {
    default: "LifeLink | Emergency Organ Exchange",
    template: "%s | LifeLink",
  },
  description:
    "LifeLink connects verified hospitals for faster, traceable emergency organ exchange.",
  keywords: ["organ exchange", "hospital network", "organ donation", "LifeLink"],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "LifeLink | Emergency Organ Exchange",
    description:
      "A trusted hospital-to-hospital network for coordinating urgent organ exchange.",
    siteName: "LifeLink",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
