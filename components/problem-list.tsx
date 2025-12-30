import React from 'react';
import { useTheme } from 'next-themes';
import { Problem } from '@/lib/storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ProblemListProps {
    problems: Problem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ProblemList({ problems, selectedId, onSelect }: ProblemListProps) {
    const [filterText, setFilterText] = React.useState('');
    const [filterDiff, setFilterDiff] = React.useState<string>('All');
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    const filtered = problems.filter(p => {
        const textMatch = (p.title + p.tags.join(' ') + (p.number || '')).toLowerCase().includes(filterText.toLowerCase());
        const diffMatch = filterDiff === 'All' || p.difficulty === filterDiff;
        return textMatch && diffMatch;
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

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
            case 'Medium': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
            case 'Hard': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-gray-500';
        }
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
                    <Select value={filterDiff} onValueChange={setFilterDiff}>
                        <SelectTrigger className="bg-background border-input h-8 text-xs">
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ScrollArea className="flex-1 overflow-hidden">
                <div className="p-2 space-y-1">
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            title={`${p.number ? p.number + '. ' : ''}${p.title || 'Untitled'}`}
                            onClick={() => onSelect(p.id)}
                            className={`p-2 rounded-md cursor-pointer transition-colors border-l-[3px] overflow-hidden ${selectedId === p.id ? 'bg-sidebar-accent border-primary' : 'hover:bg-sidebar-accent/50 border-transparent'}`}
                        >
                            <div className="font-medium text-xs truncate text-sidebar-foreground mb-0.5 min-w-0">
                                {p.number ? <span className="mr-1 text-muted-foreground">{p.number}.</span> : null}
                                {p.title || 'Untitled'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                                <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 font-semibold uppercase flex-shrink-0 ${getDiffColor(p.difficulty)}`}>
                                    {p.difficulty}
                                </Badge>
                                <span className="truncate min-w-0">
                                    {p.tags.slice(0, 2).join(', ')}{p.tags.length > 2 ? ` +${p.tags.length - 2}` : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No problems found.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
