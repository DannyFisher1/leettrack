export interface Problem {
  id: string;
  number?: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  tags: string[];
  description: string;
  notes?: string;
  code: string;
  dateAdded: string;
  dateEdited: string;
}

const STORAGE_KEY = 'leetTrackerData';
const DATA_FILENAME = 'leettrack-data.json';

// Safe check for Tauri environment
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function loadProblemsAsync(): Promise<Problem[]> {
  if (typeof window === 'undefined') return [];

  // Try loading from File System if in Tauri
  if (isTauri()) {
    try {
      const { exists, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

      const fileExists = await exists(DATA_FILENAME, { baseDir: BaseDirectory.AppLocalData });

      if (fileExists) {
        const content = await readTextFile(DATA_FILENAME, { baseDir: BaseDirectory.AppLocalData });
        const problems = JSON.parse(content);
        console.log('Loaded data from File System');
        return problems;
      } else {
        // Migration: If file doesn't exist but localStorage does, use localStorage and save to file
        console.log('File not found, checking localStorage for migration...');
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const problems = JSON.parse(localData);
          await saveProblemsAsync(problems); // Persist to file immediately
          return problems;
        }
      }
    } catch (e) {
      console.error('Failed to load from File System:', e);
    }
  }

  // Fallback / Web Mode: Usage localStorage
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse localStorage data", e);
      return [];
    }
  }
  return [];
}

export async function saveProblemsAsync(problems: Problem[]) {
  if (typeof window === 'undefined') return;

  // Always save to localStorage as backup/web state
  localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));

  // If Tauri, save to File System
  if (isTauri()) {
    try {
      const { writeTextFile, BaseDirectory, mkdir, exists } = await import('@tauri-apps/plugin-fs');

      // Ensure directory exists (AppLocalData might not be created automatically on some platforms)
      // Actually BaseDirectory.AppLocalData usually points to a valid path, but good to be safe if checking 'exists' failed weirdly
      // We will just try writing.

      await writeTextFile(DATA_FILENAME, JSON.stringify(problems, null, 2), { baseDir: BaseDirectory.AppLocalData });
      console.log('Saved data to File System');
    } catch (e) {
      console.error('Failed to save to File System:', e);
    }
  }
}

// Valid synchronous fallback for initial render to avoid hydration mismatch if needed, 
// though we usually load async in useEffect.
export function loadProblemsSync(): Problem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

const SAMPLE_PROBLEMS: Problem[] = [
  {
    id: '1',
    number: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    url: 'https://leetcode.com/problems/two-sum/',
    tags: ['Array', 'Hash Table'],
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    notes: 'Use a hash map to store the complement of the current number.',
    code: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        prevMap = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in prevMap:\n                return [prevMap[diff], i]\n            prevMap[n] = i',
    dateAdded: new Date().toISOString(),
    dateEdited: new Date().toISOString()
  },
  {
    id: '2',
    number: '146',
    title: 'LRU Cache',
    difficulty: 'Medium',
    url: 'https://leetcode.com/problems/lru-cache/',
    tags: ['Design', 'Hash Table', 'Linked List'],
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    notes: 'Double linked list + hash map is the standard way to achieve O(1) operations.',
    code: 'class LRUCache:\n    def __init__(self, capacity: int):\n        self.cap = capacity\n        self.cache = {} # map key to node\n        self.left, self.right = Node(0, 0), Node(0, 0)\n        self.left.next, self.right.prev = self.right, self.left',
    dateAdded: new Date().toISOString(),
    dateEdited: new Date().toISOString()
  },
  {
    id: '3',
    number: '23',
    title: 'Merge k Sorted Lists',
    difficulty: 'Hard',
    url: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    tags: ['Linked List', 'Divide and Conquer', 'Heap'],
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    notes: 'Min-heap is efficient here. Time complexity O(N log k).',
    code: 'class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        if not lists or len(lists) == 0:\n            return None\n        while len(lists) > 1:\n            mergedList = []\n            for i in range(0, len(lists), 2):\n                l1 = lists[i]\n                l2 = lists[i + 1] if (i + 1) < len(lists) else None\n                mergedList.append(self.mergeList(l1, l2))\n            lists = mergedList\n        return lists[0]',
    dateAdded: new Date().toISOString(),
    dateEdited: new Date().toISOString()
  }
];

export function getSampleProblems(): Problem[] {
  return SAMPLE_PROBLEMS;
}
