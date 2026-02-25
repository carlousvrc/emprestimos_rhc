import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Análise de Transferências',
    description: 'Sistema de RHC via Empréstimo',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className="antialiased font-sans">
                {children}
            </body>
        </html>
    )
}
