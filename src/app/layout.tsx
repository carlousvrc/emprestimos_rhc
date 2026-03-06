import './globals.css'
import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/providers/query-provider'

export const metadata: Metadata = {
    title: 'Análise de Transferências',
    description: 'Sistema de RHC via Empréstimo',
    icons: {
        icon: '/logo.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className="antialiased font-sans">
                <NuqsAdapter>
                    <QueryProvider>
                        {children}
                        <Toaster
                            position="top-right"
                            richColors
                            closeButton
                            toastOptions={{
                                style: { fontFamily: 'inherit' },
                            }}
                        />
                    </QueryProvider>
                </NuqsAdapter>
            </body>
        </html>
    )
}
