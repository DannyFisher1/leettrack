"use client";

import React, { useEffect, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ProblemList } from '@/components/problem-list';
import { ProblemEditor } from '@/components/problem-editor';
import { loadProblemsAsync, saveProblemsAsync, getSampleProblems, Problem } from '@/lib/storage';

export default function TrackerPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load data async
    const init = async () => {
      let data = await loadProblemsAsync();
      if (data.length === 0) {
        // Fallback to samples if empty (and check if we should populate first time)
        // Here we just use samples if empty for UX.
        data = getSampleProblems();
        await saveProblemsAsync(data);
      }
      setProblems(data);
      setIsLoaded(true);
    };
    init();
  }, []);

  const handleSave = async (p: Problem) => {
    let newProblems;
    if (problems.find(x => x.id === p.id)) {
      newProblems = problems.map(x => x.id === p.id ? p : x);
    } else {
      newProblems = [...problems, p];
    }
    setProblems(newProblems);
    await saveProblemsAsync(newProblems);
    setSelectedId(p.id);
  };

  const handleDelete = async (id: string) => {
    const newProblems = problems.filter(p => p.id !== id);
    setProblems(newProblems);
    await saveProblemsAsync(newProblems);
    setSelectedId(null);
  };

  const handleNew = () => {
    setSelectedId('new');
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  const selectedProblem = selectedId === 'new' ? null : (problems.find(p => p.id === selectedId) || null);

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={18} minSize={15} maxSize={30} className="min-w-0">
          <ProblemList
            problems={problems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onNew={handleNew}
          />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75}>
          {selectedId ? (
            <ProblemEditor
              problem={selectedProblem}
              allTags={[...new Set(problems.flatMap(p => p.tags))]}
              onSave={handleSave}
              onDelete={handleDelete}
              onNew={handleNew}
            />
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-background/50">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-semibold tracking-tight">Select a problem</h3>
                <p className="text-sm">Choose a problem from the list or create a new one.</p>
                <button
                  onClick={handleNew}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Create New Problem
                </button>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
