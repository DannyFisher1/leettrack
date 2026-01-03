import React from 'react';
import { useTheme } from 'next-themes';
import { Problem } from '@/lib/storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { openUrl } from '@/lib/shell';

interface ProblemListProps {
    problems: Problem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete?: (id: string) => void;
    onNew?: () => void;
}

// Context menu state type
interface ContextMenu {
    x: number;
    y: number;
    problem: Problem;
}

export function ProblemList({ problems, selectedId, onSelect, onDelete, onNew }: ProblemListProps) {
    const [filterText, setFilterText] = React.useState('');
    const [filterDiff, setFilterDiff] = React.useState<string>('All');
    const [filterTag, setFilterTag] = React.useState<string>('All');
    const [contextMenu, setContextMenu] = React.useState<ContextMenu | null>(null);
    const [hoveredId, setHoveredId] = React.useState<string | null>(null);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const listRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => setMounted(true), []);

    // Close context menu on click outside
    React.useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Get all unique tags
    const allTags = React.useMemo(() => {
        const tags = new Set<string>();
        problems.forEach(p => p.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [problems]);

    const filtered = problems.filter(p => {
        const textMatch = (p.title + p.tags.join(' ') + (p.number || '')).toLowerCase().includes(filterText.toLowerCase());
        const diffMatch = filterDiff === 'All' || p.difficulty === filterDiff;
        const tagMatch = filterTag === 'All' || p.tags.includes(filterTag);
        return textMatch && diffMatch && tagMatch;
    }).sort((a, b) => {
        // Sort by number if both have numbers
        const numA = parseInt(a.number || '0');
        const numB = parseInt(b.number || '0');
        if (numA && numB) return numA - numB;
        if (numA) return -1; // numA has number, b doesn't -> A first
        if (numB) return 1;  // numB has number, a doesn't -> B first

        // Fallback to date edited descending
        return new Date(b.dateEdited).getTime() - new Date(a.dateEdited).getTime();
    });

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + N for new problem
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                onNew?.();
                return;
            }

            // Arrow navigation when list is focused
            if (listRef.current?.contains(document.activeElement) || document.activeElement === document.body) {
                const currentIndex = filtered.findIndex(p => p.id === selectedId);

                if (e.key === 'ArrowDown' && currentIndex < filtered.length - 1) {
                    e.preventDefault();
                    onSelect(filtered[currentIndex + 1].id);
                } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                    e.preventDefault();
                    onSelect(filtered[currentIndex - 1].id);
                } else if (e.key === 'ArrowDown' && currentIndex === -1 && filtered.length > 0) {
                    e.preventDefault();
                    onSelect(filtered[0].id);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filtered, selectedId, onSelect, onNew]);

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
            case 'Medium': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
            case 'Hard': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-gray-500';
        }
    };

    const handleContextMenu = (e: React.MouseEvent, problem: Problem) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, problem });
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setContextMenu(null);
    };

    // Format relative time
    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-sidebar border-r border-sidebar-border">
            <div className="p-4 border-b border-sidebar-border space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-base text-primary">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-primary fill-none stroke-2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
                        LeetTrack
                    </div>
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            placeholder="Search..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="pl-8 bg-background border-input h-8 text-xs"
                        />
                        <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <div className="flex gap-2">
                        <Select value={filterDiff} onValueChange={setFilterDiff}>
                            <SelectTrigger className="bg-background border-input h-8 text-xs flex-1">
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Difficulties</SelectItem>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterTag} onValueChange={setFilterTag}>
                            <SelectTrigger className="bg-background border-input h-8 text-xs flex-1">
                                <SelectValue placeholder="Tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Tags</SelectItem>
                                {allTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 overflow-hidden">
                <div ref={listRef} className="p-2 space-y-1" tabIndex={0}>
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            onContextMenu={(e) => handleContextMenu(e, p)}
                            onMouseEnter={() => setHoveredId(p.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`p-2 rounded-md cursor-pointer transition-colors border-l-[3px] overflow-hidden min-w-0 relative group ${selectedId === p.id ? 'bg-sidebar-accent border-primary' : 'hover:bg-sidebar-accent/50 border-transparent'}`}
                        >
                            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center font-medium text-xs text-sidebar-foreground mb-0.5 w-full gap-1">
                                {p.number ? <span className="text-muted-foreground">{p.number}.</span> : null}
                                <span className="truncate">{p.title || 'Untitled'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                                <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 font-semibold uppercase flex-shrink-0 ${getDiffColor(p.difficulty)}`}>
                                    {p.difficulty}
                                </Badge>
                                <span className="truncate min-w-0">
                                    {p.tags.slice(0, 2).join(', ')}{p.tags.length > 2 ? ` +${p.tags.length - 2}` : ''}
                                </span>
                            </div>

                            {/* Enhanced Hover Tooltip */}
                            {hoveredId === p.id && (
                                <div className="absolute left-full top-0 ml-2 z-50 bg-popover border border-input rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px] pointer-events-none">
                                    <div className="font-medium text-sm mb-2">{p.number ? `${p.number}. ` : ''}{p.title}</div>
                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0.5 ${getDiffColor(p.difficulty)}`}>
                                                {p.difficulty}
                                            </Badge>
                                            {p.stats?.acRate && (
                                                <span className="text-emerald-500">{p.stats.acRate}</span>
                                            )}
                                        </div>
                                        {p.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {p.tags.map((tag, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="pt-1 border-t border-input text-[10px]">
                                            Last edited: {formatRelativeTime(p.dateEdited)}
                                        </div>
                                        {p.notes && (
                                            <div className="text-[10px] italic truncate">
                                                "{p.notes.slice(0, 50)}{p.notes.length > 50 ? '...' : ''}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No problems found.
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-popover border border-input rounded-lg shadow-lg py-1 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        onClick={() => {
                            onSelect(contextMenu.problem.id);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                        Open
                    </button>
                    {contextMenu.problem.url && (
                        <>
                            <button
                                onClick={() => {
                                    openUrl(contextMenu.problem.url);
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                            >
                                Open in LeetCode
                            </button>
                            <button
                                onClick={() => handleCopyUrl(contextMenu.problem.url)}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                            >
                                Copy URL
                            </button>
                        </>
                    )}
                    <div className="border-t border-input my-1" />
                    {onDelete && (
                        <button
                            onClick={() => {
                                onDelete(contextMenu.problem.id);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors text-destructive"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
