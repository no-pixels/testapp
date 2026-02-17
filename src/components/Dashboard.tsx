import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Trash2, Search, ExternalLink, Activity, Info, Zap, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Article {
    id: string;
    title: string;
    source: string;
    url: string;
    summary: string;
    image: string;
    published_at: string;
    category?: string;
}

const CATEGORIES = [
    { name: 'News', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
    { name: 'Tools', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { name: 'Health', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { name: 'Tutorial', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { name: 'Update', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
];

const SOURCES = [
    { name: "Ben's Bites", emoji: "🦷" },
    { name: "AI Rundown", emoji: "⚡" }
];

export default function Dashboard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSource, setActiveSource] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load data and favorites
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/data.json?t=${Date.now()}`);
                const data = await response.json();
                setArticles(data);
            } catch (e) {
                console.error('Failed to fetch articles:', e);
            } finally {
                setLoading(false);
            }
        };

        const saved = localStorage.getItem('saved_articles');
        if (saved) {
            setSavedIds(new Set(JSON.parse(saved)));
        }

        fetchData();

        // Auto-refresh every 60s
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Save favorites to localStorage
    useEffect(() => {
        localStorage.setItem('saved_articles', JSON.stringify(Array.from(savedIds)));
    }, [savedIds]);

    const toggleSave = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSavedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getFormattedDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStrShort = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        if (diffInHours < 24) {
            return `Today at ${timeStr} (${diffInHours}h ago)`;
        }
        return `${dateStrShort} at ${timeStr}`;
    };

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.source.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSource = !activeSource || article.source === activeSource;
            const matchesCategory = !activeCategory || article.category === activeCategory;
            const matchesSaved = !showSavedOnly || savedIds.has(article.id);
            return matchesSearch && matchesSource && matchesCategory && matchesSaved;
        });
    }, [articles, searchQuery, activeSource, activeCategory, showSavedOnly, savedIds]);

    return (
        <div className="relative min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-black">

            {/* CLEAN BACKGROUND */}
            <div className="absolute inset-0 bg-[#050505] pointer-events-none" />

            {/* STICKY HEADER */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="container px-4 mx-auto lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-4 py-4 md:flex-row">

                        {/* BRAND */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20 border border-accent/40 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                                <Zap className="w-6 h-6 text-accent fill-accent/20" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tighter uppercase italic">
                                    AI <span className="text-accent underline decoration-2 underline-offset-4">NIXITO</span>
                                </h1>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase leading-none">
                                    Advanced News Protocol
                                </p>
                            </div>
                        </div>

                        {/* STAT CARDS */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowSavedOnly(false); setActiveSource(null); }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 transition-all border rounded-xl",
                                    !showSavedOnly && !activeSource ? "bg-accent/10 border-accent/40 shadow-[0_0_10px_rgba(163,230,53,0.1)]" : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                            >
                                <Layers className={cn("w-4 h-4", !showSavedOnly && !activeSource ? "text-accent" : "text-zinc-500")} />
                                <div className="text-left">
                                    <span className="block text-[10px] uppercase font-bold text-zinc-500 leading-none mb-1 text-center">Articles</span>
                                    <span className="block font-mono text-sm font-bold text-center">{articles.length}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowSavedOnly(true)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 transition-all border rounded-xl",
                                    showSavedOnly ? "bg-accent/10 border-accent/40 shadow-[0_0_10px_rgba(163,230,53,0.1)]" : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                            >
                                <Heart className={cn("w-4 h-4", showSavedOnly ? "text-accent fill-accent/40" : "text-zinc-500")} />
                                <div className="text-left text-center">
                                    <span className="block text-[10px] uppercase font-bold text-zinc-500 leading-none mb-1 text-center">Saved</span>
                                    <span className="block font-mono text-sm font-bold text-center">{savedIds.size}</span>
                                </div>
                            </button>
                        </div>

                        {/* SEARCH */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="PROBE FEED..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* SOURCE & CATEGORY FILTERS - CENTERED */}
                    <div className="flex flex-col gap-4 py-6 items-center">
                        <div className="flex flex-wrap justify-center gap-2">
                            {SOURCES.map(source => (
                                <button
                                    key={source.name}
                                    onClick={() => setActiveSource(activeSource === source.name ? null : source.name)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border rounded-lg transition-all",
                                        activeSource === source.name
                                            ? "bg-accent text-black border-accent shadow-[0_0_10px_rgba(163,230,53,0.3)]"
                                            : "bg-white/5 text-zinc-400 border-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <span>{source.emoji}</span>
                                    <span>{source.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-center gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-full transition-all",
                                        activeCategory === cat.name
                                            ? `${cat.bg} ${cat.color} ${cat.border} ring-1 ring-offset-1 ring-offset-black ring-accent/20`
                                            : "bg-white/5 text-zinc-500 border-white/10 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <main className="container relative z-10 px-4 py-8 mx-auto lg:px-8">
                {loading ? (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <Activity className="w-12 h-12 text-accent animate-pulse" />
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <Info className="w-12 h-12 mb-4 text-zinc-700" />
                        <p className="text-xl font-black text-zinc-500 uppercase tracking-tighter">No Articles Found in Sector</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveSource(null); setShowSavedOnly(false); }}
                            className="mt-4 text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                        >
                            Reset Protocol
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredArticles.map(article => (
                            <a
                                key={article.id}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md transition-all hover:border-accent/40 hover:bg-white/[0.04] p-4"
                            >
                                {/* IMAGE */}
                                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-zinc-900 mb-4">
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* TIME BADGE */}
                                    <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-black uppercase tracking-tighter bg-black/80 text-accent border border-accent/20 rounded shadow-lg backdrop-blur-md">
                                        {getFormattedDate(article.published_at)}
                                    </div>
                                </div>

                                {/* META */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-accent/10 border border-accent/20 text-accent rounded whitespace-nowrap">
                                        {article.source}
                                    </span>
                                    {article.category && (
                                        <span className={cn(
                                            "px-2 py-0.5 text-[10px] font-black uppercase rounded border whitespace-nowrap",
                                            CATEGORIES.find(c => c.name === article.category)?.bg || "bg-zinc-500/10",
                                            CATEGORIES.find(c => c.name === article.category)?.color || "text-zinc-500",
                                            CATEGORIES.find(c => c.name === article.category)?.border || "border-zinc-500/20"
                                        )}>
                                            {article.category}
                                        </span>
                                    )}
                                </div>

                                {/* TITLE */}
                                <h3 className="mb-3 text-lg font-bold leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                                    {article.title}
                                </h3>

                                {/* SUB-HEADLINE (SMALLER HEADLINE) */}
                                <div className="flex items-start gap-2 mb-4">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/40 shrink-0" />
                                    <p className="text-sm text-zinc-400 line-clamp-3 font-medium leading-relaxed italic border-l-2 border-white/5 pl-3">
                                        {article.summary}
                                    </p>
                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 group-hover:text-accent transition-colors uppercase tracking-widest">
                                        <span>Read Full Intelligence</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </div>

                                    <button
                                        onClick={(e) => toggleSave(article.id, e)}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            savedIds.has(article.id)
                                                ? "bg-accent/20 text-accent border border-accent/40"
                                                : "bg-white/5 text-zinc-600 border border-white/5 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {savedIds.has(article.id) ? (
                                            <Trash2 className="w-4 h-4" />
                                        ) : (
                                            <Heart className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </main>

            <footer className="relative z-10 py-12 text-center border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
                    Secure Terminal v4.2.0 • Unified AI Intelligence
                </p>
            </footer>
        </div>
    );
}
