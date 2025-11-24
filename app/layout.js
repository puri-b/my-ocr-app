import './global.css';

export const metadata = {
  title: 'OCR Web App',
  description: 'OCR with Gemini AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
