import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CedroID - Cadastro Biométrico Facial',
  description: 'Sistema CedroID para recepção laboratorial e cadastro biométrico facial de pacientes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-100 min-h-screen text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
