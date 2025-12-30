const API_BASE = 'https://leetcode-api-pied.vercel.app';

// Types for API responses
export interface LeetCodeSearchResult {
    id: string;
    frontend_id: string;
    title: string;
    title_slug: string;
    url: string;
}

export interface LeetCodeProblemStats {
    totalAccepted: string;
    totalSubmission: string;
    totalAcceptedRaw: number;
    totalSubmissionRaw: number;
    acRate: string;
}

export interface LeetCodeSimilarQuestion {
    title: string;
    titleSlug: string;
    difficulty: string;
}

export interface LeetCodeTopicTag {
    name: string;
}

export interface LeetCodeSolution {
    canSeeDetail: boolean;
    content: string | null;
    hasSolution: boolean;
    hasVideoSolution: boolean;
}

export interface LeetCodeProblemDetail {
    id: string;
    frontend_id: string;
    title: string;
    title_slug: string;
    url: string;
    content: string; // HTML content
    likes: number;
    dislikes: number;
    stats: string; // JSON string, parse to LeetCodeProblemStats
    similarQuestions: string; // JSON string, parse to LeetCodeSimilarQuestion[]
    hints: string[];
    topicTags: LeetCodeTopicTag[];
    difficulty: string;
    isPaidOnly: boolean;
    solution: LeetCodeSolution | null;
    categoryTitle: string;
}

// Legacy interface for local JSON autocomplete
export interface LeetCodeProblem {
    frontendQuestionId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: { name: string }[];
}

let cachedProblems: LeetCodeProblem[] | null = null;

// Load local problems.json for autocomplete
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

// Search from local JSON (for fast autocomplete)
export async function searchLeetCode(query: string): Promise<LeetCodeProblem[]> {
    const problems = await getLeetCodeProblems();
    const lowerQuery = query.toLowerCase();

    return problems
        .filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.frontendQuestionId.includes(lowerQuery)
        )
        .slice(0, 10);
}

// Search from API (more accurate but slower)
export async function searchProblemsAPI(query: string): Promise<LeetCodeSearchResult[]> {
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search API failed');
        const results: LeetCodeSearchResult[] = await res.json();
        return results.slice(0, 20);
    } catch (error) {
        console.error('Error searching LeetCode API:', error);
        return [];
    }
}

// Fetch full problem details from API
export async function getProblemDetails(idOrSlug: string): Promise<LeetCodeProblemDetail | null> {
    try {
        const res = await fetch(`/api/problem/${encodeURIComponent(idOrSlug)}`);
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Problem API failed');
        }
        const data: LeetCodeProblemDetail = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching problem details:', error);
        return null;
    }
}

// Get daily challenge
export async function getDailyChallenge(): Promise<LeetCodeProblemDetail | null> {
    try {
        const res = await fetch(`/api/daily`);
        if (!res.ok) throw new Error('Daily API failed');
        const data: LeetCodeProblemDetail = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching daily challenge:', error);
        return null;
    }
}

// Get random problem
export async function getRandomProblem(): Promise<LeetCodeProblemDetail | null> {
    try {
        const res = await fetch(`/api/random`);
        if (!res.ok) throw new Error('Random API failed');
        const data: LeetCodeProblemDetail = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching random problem:', error);
        return null;
    }
}

// Helper to parse stats JSON
export function parseStats(statsJson: string): LeetCodeProblemStats | null {
    try {
        return JSON.parse(statsJson);
    } catch {
        return null;
    }
}

// Helper to parse similar questions JSON
export function parseSimilarQuestions(json: string): LeetCodeSimilarQuestion[] {
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}
