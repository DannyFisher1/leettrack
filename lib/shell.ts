// Shell utility for opening URLs in the default browser
// Works in both Tauri (native) and web (browser) environments

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function openUrl(url: string): Promise<void> {
    if (isTauri()) {
        try {
            const { open } = await import('@tauri-apps/plugin-shell');
            await open(url);
        } catch (error) {
            console.error('Failed to open URL with Tauri shell:', error);
            // Fallback to window.open
            window.open(url, '_blank');
        }
    } else {
        window.open(url, '_blank');
    }
}
