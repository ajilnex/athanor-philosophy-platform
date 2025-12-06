import { Toaster } from 'react-hot-toast'

export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
    // Immersive layout without navbar/footer for special experiences like Archive
    // Uses a wrapper div with dark class for dark mode styling
    return (
        <div className="dark min-h-screen">
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                    },
                }}
            />
        </div>
    )
}
