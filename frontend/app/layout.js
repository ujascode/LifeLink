import "./globals.css";

export const metadata = {
  title: "LifeLink",
  description: "Emergency Organ Donor Network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
