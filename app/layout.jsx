import "./globals.css";
export const metadata = {
  title: "FTP Telephone Book",
  description: "FTP Telephone Book - Fairmont The Palm Directory",
  manifest: "/site.webmanifest",
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon-32x32.png", sizes: "32x32" }, { url: "/favicon-16x16.png", sizes: "16x16" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Phonebook" },
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#151515" }, { media: "(prefers-color-scheme: light)", color: "#ffffff" }] };
export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.classList.toggle('dark',localStorage.getItem('theme')!=='light')}catch(e){document.documentElement.classList.add('dark')}" }} />
  </head><body>{children}</body></html>;
}
