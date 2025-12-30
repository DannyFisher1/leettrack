export interface LeetCodeProblem {
    frontendQuestionId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: { name: string }[];
}

let cachedProblems: LeetCodeProblem[] | null = null;

export async function getLeetCodeProblems(): Promise<LeetCodeProblem[]> {
    if (cachedProblems) return cachedProblems;

    try {
        const res = await fetch('/problems.json');
        if (!res.ok) throw new Error('Failed to load problems');
        cachedProblems = await res.json();
        return cachedProblems || [];
    } catch (error) {
        console.error('Error loading LeetCode problems:', error);
        return [];
    }
}

export async function searchLeetCode(query: string): Promise<LeetCodeProblem[]> {
    const problems = await getLeetCodeProblems();
    const lowerQuery = query.toLowerCase();

    return problems
        .filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.frontendQuestionId.includes(lowerQuery)
        )
        .slice(0, 10); // Limit results
}
