import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search } from 'lucide-react';

export const BrowserApp: React.FC = () => {
    const [url, setUrl] = useState('https://www.google.com');
    const [inputUrl, setInputUrl] = useState('https://www.google.com');
    const [isLoading, setIsLoading] = useState(false);
    const webviewRef = useRef<any>(null);

    const handleNavigate = (e: React.FormEvent) => {
        e.preventDefault();
        let targetUrl = inputUrl;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            // Check if it looks like a domain
            if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
                targetUrl = 'https://' + targetUrl;
            } else {
                // Search google
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            }
        }
        setUrl(targetUrl);
        setInputUrl(targetUrl);
    };

    // Update address bar when webview navigates
    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        const handleDidStartLoading = () => setIsLoading(true);
        const handleDidStopLoading = () => setIsLoading(false);
        const handleDidNavigate = (e: any) => {
            setInputUrl(e.url);
        };

        webview.addEventListener('did-start-loading', handleDidStartLoading);
        webview.addEventListener('did-stop-loading', handleDidStopLoading);
        webview.addEventListener('did-navigate', handleDidNavigate); // For in-page navigation
        webview.addEventListener('did-navigate-in-page', handleDidNavigate); // For hash changes etc

        return () => {
            if (webview) {
                webview.removeEventListener('did-start-loading', handleDidStartLoading);
                webview.removeEventListener('did-stop-loading', handleDidStopLoading);
                webview.removeEventListener('did-navigate', handleDidNavigate);
                webview.removeEventListener('did-navigate-in-page', handleDidNavigate);
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white rounded-b-xl overflow-hidden">
            {/* Browser Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-gray-100/80 backdrop-blur-md border-b border-gray-200/50">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => webviewRef.current?.goBack()}
                        className="p-1.5 text-gray-600 hover:bg-gray-200/50 rounded-md transition-colors disabled:opacity-30"
                        title="Back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <button
                        onClick={() => webviewRef.current?.goForward()}
                        className="p-1.5 text-gray-600 hover:bg-gray-200/50 rounded-md transition-colors"
                        title="Forward"
                    >
                        <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={() => webviewRef.current?.reload()}
                        className={`p-1.5 text-gray-600 hover:bg-gray-200/50 rounded-md transition-colors ${isLoading ? 'animate-spin' : ''}`}
                        title="Reload"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>

                <form onSubmit={handleNavigate} className="flex-1 relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-9 pr-4 py-1.5 text-sm bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-sm"
                        placeholder="Search or enter website name"
                    />
                </form>
            </div>

            {/* Webview Content */}
            <div className="flex-1 relative bg-white">
                <webview
                    ref={webviewRef}
                    src={url}
                    className="w-full h-full"
                    allowpopups
                    webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes"
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    partition="persist:browser"
                />
            </div>
        </div>
    );
};
