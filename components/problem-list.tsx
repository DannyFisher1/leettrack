import React from 'react';
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
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
            <div className="p-4 border-b border-sidebar-border space-y-3">
                <div className="flex items-center gap-2 font-bold text-base text-primary">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-primary fill-none stroke-2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
                    LeetTrack
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

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className={`p-2 rounded-md cursor-pointer transition-colors border-l-[3px] ${selectedId === p.id ? 'bg-sidebar-accent border-primary' : 'hover:bg-sidebar-accent/50 border-transparent'}`}
                        >
                            <div className="font-medium text-xs truncate text-sidebar-foreground mb-0.5">
                                {p.number ? <span className="mr-1 text-muted-foreground">{p.number}.</span> : null}
                                {p.title || 'Untitled'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 font-semibold uppercase flex-shrink-0 ${getDiffColor(p.difficulty)}`}>
                                    {p.difficulty}
                                </Badge>
                                <span className="truncate">
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
