import React from 'react';
import { Problem, ProblemStats, SimilarQuestion } from '@/lib/storage';
import { searchLeetCode, LeetCodeProblem, getProblemDetails, parseStats, parseSimilarQuestions } from '@/lib/leetcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, ExternalLink, Copy, Plus, X, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, Lightbulb, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from "@codemirror/view";

const codeMirrorExtensions = [python()];

// Parse problem content into sections
function parseContent(html: string): { description: string; examples: string; constraints: string } {
    // Find where examples start
    const exampleMatch = html.match(/<p><strong[^>]*>Example\s*1/i) ||
        html.match(/<strong>Example\s*1/i) ||
        html.match(/Example\s*1:/i);

    // Find where constraints start
    const constraintsMatch = html.match(/<p><strong[^>]*>Constraints/i) ||
        html.match(/<strong>Constraints/i) ||
        html.match(/Constraints:/i);

    let description = html;
    let examples = '';
    let constraints = '';

    if (exampleMatch && exampleMatch.index !== undefined) {
        description = html.substring(0, exampleMatch.index);
        const afterDesc = html.substring(exampleMatch.index);

        if (constraintsMatch && constraintsMatch.index !== undefined) {
            const constraintStart = html.indexOf(constraintsMatch[0], exampleMatch.index);
            examples = html.substring(exampleMatch.index, constraintStart);
            constraints = html.substring(constraintStart);
        } else {
            examples = afterDesc;
        }
    } else if (constraintsMatch && constraintsMatch.index !== undefined) {
        description = html.substring(0, constraintsMatch.index);
        constraints = html.substring(constraintsMatch.index);
    }

    return { description, examples, constraints };
}

interface ProblemEditorProps {
    problem: Problem | null;
    allTags: string[];
    onSave: (p: Problem) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
}

function ProblemEditorComponent({ problem, allTags, onSave, onDelete, onNew }: ProblemEditorProps) {
    const [formData, setFormData] = React.useState<Partial<Problem>>({});
    const [tagInput, setTagInput] = React.useState('');
    const [isCopied, setIsCopied] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const [predictions, setPredictions] = React.useState<LeetCodeProblem[]>([]);
    const [numberPredictions, setNumberPredictions] = React.useState<LeetCodeProblem[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
    const [hintsExpanded, setHintsExpanded] = React.useState(false);
    const [similarExpanded, setSimilarExpanded] = React.useState(false);
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    const notesRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (problem) {
            setFormData({ ...problem });
            // If problem has titleSlug but no content, fetch it
            if (problem.titleSlug && !problem.content) {
                fetchProblemDetails(problem.titleSlug);
            }
        } else {
            setFormData({
                title: '',
                difficulty: 'Easy',
                url: '',
                tags: [],
                code: '',
                notes: '',
                notesHeight: undefined
            });
        }
    }, [problem]);

    const fetchProblemDetails = async (slug: string) => {
        setIsLoadingDetails(true);
        try {
            const details = await getProblemDetails(slug);
            if (details) {
                const stats = parseStats(details.stats);
                const similar = parseSimilarQuestions(details.similarQuestions);
                setFormData(prev => ({
                    ...prev,
                    content: details.content,
                    hints: details.hints,
                    likes: details.likes,
                    dislikes: details.dislikes,
                    stats: stats || undefined,
                    similarQuestions: similar,
                    hasSolution: details.solution?.hasSolution,
                    isPaidOnly: details.isPaidOnly,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch problem details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

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
        const notesHeight = notesRef.current?.offsetHeight;

        const p: Problem = {
            id: formData.id || Date.now().toString(),
            number: formData.number || '',
            title: formData.title || 'Untitled',
            titleSlug: formData.titleSlug,
            difficulty: formData.difficulty as any || 'Easy',
            url: formData.url || '',
            tags: formData.tags || [],
            notes: formData.notes || '',
            code: formData.code || '',
            content: formData.content,
            hints: formData.hints,
            likes: formData.likes,
            dislikes: formData.dislikes,
            stats: formData.stats,
            similarQuestions: formData.similarQuestions,
            hasSolution: formData.hasSolution,
            isPaidOnly: formData.isPaidOnly,
            dateAdded: formData.dateAdded || now,
            dateEdited: now,
            notesHeight: notesHeight
        };
        onSave(p);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const copyCode = () => {
        if (formData.code) {
            navigator.clipboard.writeText(formData.code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleSelectProblem = async (p: LeetCodeProblem) => {
        handleChange('number', p.frontendQuestionId);
        handleChange('title', p.title);
        handleChange('titleSlug', p.titleSlug);
        handleChange('difficulty', p.difficulty);
        handleChange('tags', p.topicTags.map(t => t.name));
        handleChange('url', `https://leetcode.com/problems/${p.titleSlug}/`);
        setPredictions([]);
        setNumberPredictions([]);
        // Fetch full details
        await fetchProblemDetails(p.titleSlug);
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
    }, [formData]);

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'text-emerald-500';
            case 'Medium': return 'text-amber-500';
            case 'Hard': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Saved Toast */}
            <div
                className={`fixed bottom-6 right-6 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 z-50 ${isSaved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            >
                Saved
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    {problem && formData.number && (
                        <span className="text-2xl font-bold text-muted-foreground">{formData.number}.</span>
                    )}
                    <h2 className="text-xl font-semibold truncate">
                        {formData.title || (problem ? 'Untitled' : 'New Problem')}
                    </h2>
                    {formData.difficulty && (
                        <Badge variant="outline" className={`${getDifficultyColor(formData.difficulty)} border-current font-semibold`}>
                            {formData.difficulty}
                        </Badge>
                    )}
                    {formData.isPaidOnly && (
                        <Badge variant="secondary" className="text-amber-500 bg-amber-500/10">Premium</Badge>
                    )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={onNew} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="New Problem">
                        <Plus className="w-4 h-4" />
                    </button>
                    {problem && (
                        <button
                            className={`p-1.5 rounded-md transition-colors ${confirmDelete ? 'bg-destructive text-white' : 'hover:bg-destructive/10 text-destructive'}`}
                            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
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
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium flex items-center gap-1.5"
                        title={navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'}
                    >
                        <Save className="w-3.5 h-3.5" />
                        Save
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search/Add Section (only for new problems or editing metadata) */}
                {!problem && (
                    <div className="space-y-4 p-4 rounded-lg border border-dashed border-input bg-secondary/20">
                        <div className="flex gap-4">
                            <div className="w-24 relative">
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">Number</label>
                                <Input
                                    value={formData.number || ''}
                                    onChange={e => {
                                        handleChange('number', e.target.value);
                                        if (e.target.value.length > 0) {
                                            searchLeetCode(e.target.value).then(setNumberPredictions);
                                        } else {
                                            setNumberPredictions([]);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setNumberPredictions([]), 200)}
                                    placeholder="#"
                                    className="bg-background border-input"
                                />
                                {numberPredictions.length > 0 && (
                                    <div className="absolute z-50 w-72 mt-1 bg-popover border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {numberPredictions.map(p => (
                                            <button
                                                key={p.frontendQuestionId}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                                                onClick={() => handleSelectProblem(p)}
                                            >
                                                <span className="truncate mr-2">{p.frontendQuestionId}. {p.title}</span>
                                                <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0">{p.difficulty}</Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <label className="text-sm font-medium mb-1 block text-muted-foreground">Title</label>
                                <Input
                                    value={formData.title || ''}
                                    onChange={e => {
                                        handleChange('title', e.target.value);
                                        if (e.target.value.length > 2) {
                                            searchLeetCode(e.target.value).then(setPredictions);
                                        } else {
                                            setPredictions([]);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setPredictions([]), 200)}
                                    placeholder="Search for a problem..."
                                    className="bg-background border-input"
                                />
                                {predictions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {predictions.map(p => (
                                            <button
                                                key={p.frontendQuestionId}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                                                onClick={() => handleSelectProblem(p)}
                                            >
                                                <span>{p.frontendQuestionId}. {p.title}</span>
                                                <Badge variant="outline" className="text-[10px] h-5">{p.difficulty}</Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoadingDetails && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading problem details...
                    </div>
                )}

                {/* Stats Bar */}
                {formData.likes !== undefined && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{formData.likes?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThumbsDown className="w-4 h-4" />
                            <span>{formData.dislikes?.toLocaleString()}</span>
                        </div>
                        {formData.stats && (
                            <span className="text-emerald-500 font-medium">{formData.stats.acRate} Acceptance</span>
                        )}
                        {formData.url && (
                            <a href={formData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
                                <ExternalLink className="w-4 h-4" />
                                Open on LeetCode
                            </a>
                        )}
                    </div>
                )}

                {/* Tags */}
                {(formData.tags?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {formData.tags?.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="px-2 py-1 text-xs">
                                {tag}
                                {!problem && (
                                    <button type="button" onClick={() => removeTag(i)} className="ml-1 hover:text-destructive">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                        {!problem && !isAddingTag && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingTag(true);
                                    setTimeout(() => document.getElementById('tag-input')?.focus(), 0);
                                }}
                                className="px-2 py-1 text-xs rounded-md border border-dashed border-input hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                            >
                                + Add Tag
                            </button>
                        )}
                    </div>
                )}

                {/* Tag Input (for new problems) */}
                {!problem && isAddingTag && (
                    <div className="relative">
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
                            onBlur={() => setTimeout(() => { if (!tagInput) setIsAddingTag(false); }, 200)}
                            placeholder="Type to search or add..."
                            className="bg-secondary border-input text-sm h-8 w-48"
                        />
                    </div>
                )}

                {/* Problem Content (from API) */}
                {formData.content && (() => {
                    const parsed = parseContent(formData.content);
                    return (
                        <div className="space-y-4">
                            {/* Description */}
                            {parsed.description && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none text-sm prose-p:my-1.5 prose-code:text-xs prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                                        dangerouslySetInnerHTML={{ __html: parsed.description }}
                                    />
                                </div>
                            )}

                            {/* Examples */}
                            {parsed.examples && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Examples</h3>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none text-sm bg-secondary/30 rounded-lg p-4 
                                                   prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-background prose-pre:text-xs prose-pre:p-3
                                                   prose-strong:text-foreground"
                                        dangerouslySetInnerHTML={{ __html: parsed.examples }}
                                    />
                                </div>
                            )}

                            {/* Constraints */}
                            {parsed.constraints && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Constraints</h3>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none text-xs bg-muted/50 rounded-lg p-3
                                                   prose-ul:my-1 prose-li:my-0 prose-code:text-[11px] prose-code:bg-secondary prose-code:px-1 prose-code:rounded"
                                        dangerouslySetInnerHTML={{ __html: parsed.constraints }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Hints Section */}
                {formData.hints && formData.hints.length > 0 && (
                    <div className="border border-input rounded-lg">
                        <button
                            onClick={() => setHintsExpanded(!hintsExpanded)}
                            className="w-full flex items-center gap-2 p-3 text-sm font-medium hover:bg-accent/50 transition-colors"
                        >
                            {hintsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Hints ({formData.hints.length})
                        </button>
                        {hintsExpanded && (
                            <div className="px-4 pb-4 space-y-2">
                                {formData.hints.map((hint, i) => (
                                    <div key={i} className="p-3 rounded-md bg-amber-500/5 border border-amber-500/20 text-sm">
                                        <span className="font-medium text-amber-500">Hint {i + 1}:</span> {hint}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Similar Questions */}
                {formData.similarQuestions && formData.similarQuestions.length > 0 && (
                    <div className="border border-input rounded-lg">
                        <button
                            onClick={() => setSimilarExpanded(!similarExpanded)}
                            className="w-full flex items-center gap-2 p-3 text-sm font-medium hover:bg-accent/50 transition-colors"
                        >
                            {similarExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            Similar Questions ({formData.similarQuestions.length})
                        </button>
                        {similarExpanded && (
                            <div className="px-4 pb-4 space-y-1">
                                {formData.similarQuestions.map((sq, i) => (
                                    <a
                                        key={i}
                                        href={`https://leetcode.com/problems/${sq.titleSlug}/`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-sm"
                                    >
                                        <span>{sq.title}</span>
                                        <Badge variant="outline" className={`text-[10px] ${getDifficultyColor(sq.difficulty)}`}>
                                            {sq.difficulty}
                                        </Badge>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Divider */}
                {formData.content && <div className="border-t border-input" />}

                {/* Your Notes */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Your Notes / Strategy</label>
                    <Textarea
                        ref={notesRef}
                        value={formData.notes || ''}
                        onChange={e => handleChange('notes', e.target.value)}
                        style={{ height: formData.notesHeight ? `${formData.notesHeight}px` : undefined }}
                        className="min-h-[100px] bg-secondary/30 border-input text-sm font-normal resize-y"
                        placeholder="Your personal notes, approach, time complexity..."
                    />
                </div>

                {/* Your Solution Code */}
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Your Solution (Python)</label>
                        <Button variant="ghost" size="sm" onClick={copyCode} className="h-6 text-xs">
                            <Copy className="w-3 h-3 mr-1" />
                            {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                    <div className="rounded-md border border-input overflow-hidden bg-secondary/30">
                        <CodeMirror
                            value={formData.code || ''}
                            height="auto"
                            minHeight="300px"
                            theme={(mounted && theme === 'dark') ? [oneDark, EditorView.theme({
                                "&": { backgroundColor: "transparent !important" },
                                ".cm-gutters": { backgroundColor: "transparent !important" }
                            })] : undefined}
                            extensions={codeMirrorExtensions}
                            onChange={(value) => handleChange('code', value)}
                            placeholder="# Paste your Python solution here..."
                            className="text-sm"
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

                {/* Last Edited */}
                <div className="text-xs text-muted-foreground text-right">
                    Last edited: {formData.dateEdited ? new Date(formData.dateEdited).toLocaleString() : 'Never'}
                </div>
            </div>
        </div>
    );
}

export const ProblemEditor = React.memo(ProblemEditorComponent);
