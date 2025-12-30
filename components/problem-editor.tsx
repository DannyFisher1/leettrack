import React from 'react';
import { Problem } from '@/lib/storage';
import { searchLeetCode, LeetCodeProblem } from '@/lib/leetcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save, ExternalLink, Copy, Plus, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

interface ProblemEditorProps {
    problem: Problem | null;
    allTags: string[];
    onSave: (p: Problem) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
}

export function ProblemEditor({ problem, allTags, onSave, onDelete, onNew }: ProblemEditorProps) {
    const [formData, setFormData] = React.useState<Partial<Problem>>({});
    const [tagInput, setTagInput] = React.useState('');
    const [isCopied, setIsCopied] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const [predictions, setPredictions] = React.useState<LeetCodeProblem[]>([]);
    const [numberPredictions, setNumberPredictions] = React.useState<LeetCodeProblem[]>([]);

    // Refs for textarea height capture
    const descRef = React.useRef<HTMLTextAreaElement>(null);
    const notesRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (problem) {
            setFormData({ ...problem });
        } else {
            setFormData({
                title: '',
                difficulty: 'Easy',
                url: '',
                tags: [],
                description: '',
                code: '',
                descriptionHeight: undefined,
                notesHeight: undefined
            });
        }
    }, [problem]);

    const handleChange = (field: keyof Problem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const [isAddingTag, setIsAddingTag] = React.useState(false);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTags = [...(formData.tags || [])];
            if (!newTags.includes(tagInput.trim())) {
                newTags.push(tagInput.trim());
                handleChange('tags', newTags);
            }
            setTagInput('');
            setIsAddingTag(false);
        }
    };

    const removeTag = (tagIdx: number) => {
        const newTags = [...(formData.tags || [])];
        newTags.splice(tagIdx, 1);
        handleChange('tags', newTags);
    };

    const handleSave = () => {
        const now = new Date().toISOString();
        // Capture current textarea heights from DOM
        const descHeight = descRef.current?.offsetHeight;
        const notesHeight = notesRef.current?.offsetHeight;

        const p: Problem = {
            id: formData.id || Date.now().toString(),
            number: formData.number || '',
            title: formData.title || 'Untitled',
            difficulty: formData.difficulty as any || 'Easy',
            url: formData.url || '',
            tags: formData.tags || [],
            description: formData.description || '',
            notes: formData.notes || '',
            code: formData.code || '',
            dateAdded: formData.dateAdded || now,
            dateEdited: now,
            descriptionHeight: descHeight,
            notesHeight: notesHeight
        };
        onSave(p);
    };

    const copyCode = () => {
        if (formData.code) {
            navigator.clipboard.writeText(formData.code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    // Handle Tab indentation in code editor
    const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;
            const newValue = value.substring(0, start) + "    " + value.substring(end);

            handleChange('code', newValue);

            // Need to defer setting selection range after render (React state update is async-ish)
            // For this simple version we might lose cursor position perfectly but let's try
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 4;
            }, 0);
        }
    };

    // Keyboard shortcut for Save
    React.useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [formData]); // Re-bind when formData changes so we save the latest

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
                <h2 className="text-lg font-semibold">{problem ? 'Edit Problem' : 'New Problem'}</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        New
                    </Button>
                    {problem && (
                        <Button
                            variant={confirmDelete ? "destructive" : "ghost"}
                            size="sm"
                            className={confirmDelete ? "" : "text-destructive hover:bg-destructive/10"}
                            onClick={() => {
                                if (confirmDelete) {
                                    onDelete(problem.id);
                                    setConfirmDelete(false);
                                } else {
                                    setConfirmDelete(true);
                                    setTimeout(() => setConfirmDelete(false), 3000);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {confirmDelete ? 'Confirm Delete' : 'Delete'}
                        </Button>
                    )}
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save ({navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'})
                    </Button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
                <div className="flex gap-4 flex-shrink-0">
                    <div className="w-24 flex-shrink-0 relative">
                        <label className="text-sm font-medium mb-1 block text-muted-foreground">Number</label>
                        <Input
                            value={formData.number || ''}
                            onChange={e => {
                                handleChange('number', e.target.value);
                                if (e.target.value.length > 0) {
                                    searchLeetCode(e.target.value).then(setParams => {
                                        setNumberPredictions(setParams);
                                    });
                                } else {
                                    setNumberPredictions([]);
                                }
                            }}
                            onBlur={() => setTimeout(() => setNumberPredictions([]), 200)}
                            placeholder="#"
                            className="bg-secondary border-input"
                        />
                        {numberPredictions.length > 0 && (
                            <div className="absolute z-50 w-64 mt-1 bg-popover border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {numberPredictions.map(p => (
                                    <button
                                        key={p.frontendQuestionId}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                                        onClick={() => {
                                            handleChange('number', p.frontendQuestionId);
                                            handleChange('title', p.title);
                                            handleChange('difficulty', p.difficulty);
                                            handleChange('tags', p.topicTags.map(t => t.name));
                                            handleChange('url', `https://leetcode.com/problems/${p.titleSlug}/`);
                                            setNumberPredictions([]);
                                        }}
                                    >
                                        <span className="truncate mr-2">{p.frontendQuestionId}. {p.title}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0">{p.difficulty}</Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow flex-[3] relative">
                        <label className="text-sm font-medium mb-1 block text-muted-foreground">Title</label>
                        <Input
                            value={formData.title || ''}
                            onChange={e => {
                                handleChange('title', e.target.value);
                                if (e.target.value.length > 2) {
                                    searchLeetCode(e.target.value).then(setParams => {
                                        setPredictions(setParams);
                                    });
                                } else {
                                    setPredictions([]);
                                }
                            }}
                            onBlur={() => setTimeout(() => setPredictions([]), 200)}
                            placeholder="e.g. Two Sum"
                            className="bg-secondary border-input"
                        />
                        {predictions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {predictions.map(p => (
                                    <button
                                        key={p.frontendQuestionId}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                                        onClick={() => {
                                            handleChange('number', p.frontendQuestionId);
                                            handleChange('title', p.title);
                                            handleChange('difficulty', p.difficulty);
                                            handleChange('tags', p.topicTags.map(t => t.name));
                                            handleChange('url', `https://leetcode.com/problems/${p.titleSlug}/`);
                                            setPredictions([]);
                                        }}
                                    >
                                        <span>{p.frontendQuestionId}. {p.title}</span>
                                        <Badge variant="outline" className="text-[10px] h-5">{p.difficulty}</Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-32 flex-shrink-0">
                        <label className="text-sm font-medium mb-1 block text-muted-foreground">Difficulty</label>
                        <Select
                            value={formData.difficulty}
                            onValueChange={v => handleChange('difficulty', v)}
                        >
                            <SelectTrigger className="bg-secondary border-input">
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">URL</label>
                    <div className="relative">
                        <ExternalLink className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            value={formData.url || ''}
                            onChange={e => handleChange('url', e.target.value)}
                            placeholder="https://leetcode.com/problems/..."
                            className="pl-9 bg-secondary border-input"
                        />
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">Tags</label>

                    {/* Selected Tags + Add Button */}
                    <div className="flex flex-wrap items-center gap-2">
                        {formData.tags?.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="px-2 py-1 text-xs">
                                {tag}
                                <button type="button" onClick={() => removeTag(i)} className="ml-1 hover:text-destructive">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                        {!isAddingTag && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingTag(true);
                                    // Use setTimeout to ensure element is rendered
                                    setTimeout(() => document.getElementById('tag-input')?.focus(), 0);
                                }}
                                className="px-2 py-1 text-xs rounded-md border border-dashed border-input hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                            >
                                + Add Tag
                            </button>
                        )}
                    </div>

                    {/* Tag Input with Autocomplete */}
                    {isAddingTag && (
                        <div className="relative mt-2">
                            <Input
                                id="tag-input"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsAddingTag(false);
                                        setTagInput('');
                                    }
                                    handleAddTag(e);
                                }}
                                onBlur={() => {
                                    // Small timeout to allow clicking suggestions
                                    setTimeout(() => {
                                        if (!tagInput) setIsAddingTag(false);
                                    }, 200);
                                }}
                                placeholder="Type to search or add..."
                                className="bg-secondary border-input text-sm h-8"
                            />
                            {tagInput && allTags.filter(t =>
                                t.toLowerCase().includes(tagInput.toLowerCase()) &&
                                !formData.tags?.includes(t)
                            ).length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-popover border border-input rounded-md shadow-lg max-h-32 overflow-y-auto">
                                        {allTags.filter(t =>
                                            t.toLowerCase().includes(tagInput.toLowerCase()) &&
                                            !formData.tags?.includes(t)
                                        ).slice(0, 8).map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                                                onClick={() => {
                                                    handleChange('tags', [...(formData.tags || []), tag]);
                                                    setTagInput('');
                                                    setIsAddingTag(false);
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                )}
                        </div>
                    )}

                    {/* Quick Add Topics - only show when few or no tags */}
                    {(formData.tags?.length || 0) < 3 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {['Array', 'String', 'Hash Table', 'DP', 'Math', 'Sorting', 'Greedy', 'DFS', 'BFS', 'Binary Search', 'Two Pointers', 'Stack', 'Tree', 'Graph', 'Linked List', 'Heap'].filter(t => !formData.tags?.includes(t)).slice(0, 8).map(topic => (
                                <button
                                    key={topic}
                                    type="button"
                                    className="px-1.5 py-0.5 text-[10px] rounded border border-input hover:bg-accent transition-colors text-muted-foreground"
                                    onClick={() => handleChange('tags', [...(formData.tags || []), topic])}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 flex-shrink-0">
                    <div>
                        <label className="text-sm font-medium mb-1 block text-muted-foreground">Description / Examples</label>
                        <Textarea
                            ref={descRef}
                            value={formData.description || ''}
                            onChange={e => handleChange('description', e.target.value)}
                            style={{ height: formData.descriptionHeight ? `${formData.descriptionHeight}px` : undefined }}
                            className="min-h-[100px] bg-secondary border-input text-sm font-normal resize-y"
                            placeholder="Problem description and examples..."
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block text-muted-foreground">Notes / Strategy</label>
                        <Textarea
                            ref={notesRef}
                            value={formData.notes || ''}
                            onChange={e => handleChange('notes', e.target.value)}
                            style={{ height: formData.notesHeight ? `${formData.notesHeight}px` : undefined }}
                            className="min-h-[100px] bg-secondary border-input text-sm font-normal resize-y"
                            placeholder="Your personal notes, approach, time complexity..."
                        />
                    </div>
                </div>

                <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-1 flex-shrink-0">
                        <label className="text-sm font-medium">Solution Code (Python)</label>
                        <Button variant="ghost" size="sm" onClick={copyCode} className="h-6 text-xs">
                            <Copy className="w-3 h-3 mr-1" />
                            {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                    <div className="flex-grow rounded-md overflow-hidden border border-input relative">
                        <CodeMirror
                            value={formData.code || ''}
                            height="100%"
                            theme={oneDark}
                            extensions={[python()]}
                            onChange={(value) => handleChange('code', value)}
                            placeholder="# Paste your Python solution here..."
                            className="absolute inset-0 text-sm"
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLineGutter: true,
                                highlightActiveLine: true,
                                foldGutter: true,
                                tabSize: 4,
                            }}
                        />
                    </div>
                </div>

                <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                    Last edited: {formData.dateEdited ? new Date(formData.dateEdited).toLocaleString() : 'Never'}
                </div>
            </div>
        </div>
    );
}
