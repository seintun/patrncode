---
title: '14 Coding Interview Patterns You Need to Master'
description: "Stop memorizing LeetCode problems. Learn these 14 foundational patterns and you'll be able to solve problems you've never seen before."
publishedAt: '2026-03-01'
tags: ['patterns', 'leetcode', 'interview prep', 'algorithms']
author: 'sophocode'
---

Most engineers prepare for coding interviews the wrong way. They grind hundreds of LeetCode problems hoping that sheer volume will carry them through. It rarely does.

The engineers who consistently ace interviews don't memorize solutions — they recognize patterns. When they see a new problem, they ask: _which pattern does this fit?_ That question unlocks the solution.

Here are the 14 patterns that cover the vast majority of coding interview questions.

## 1. Two Pointers

Use two pointers moving through a sequence — either toward each other (opposite direction) or in the same direction at different speeds.

**When to use it:** Sorted array or linked list problems where you're looking for a pair, removing duplicates, or partitioning elements.

**Classic problems:** Two Sum (sorted), Remove Duplicates, Container With Most Water.

## 2. Sliding Window

Maintain a window over a contiguous subarray or substring, expanding and shrinking it to satisfy a condition.

**When to use it:** "Find the longest/shortest subarray/substring with property X" — especially when the brute force is O(n²).

**Classic problems:** Longest Substring Without Repeating Characters, Minimum Window Substring.

## 3. Fast and Slow Pointers (Floyd's Cycle Detection)

Two pointers move at different speeds through a linked list or array. The fast pointer moves 2x as fast as the slow pointer.

**When to use it:** Cycle detection in linked lists, finding the middle of a linked list, detecting the start of a cycle.

**Classic problems:** Linked List Cycle, Find the Duplicate Number, Happy Number.

## 4. Merge Intervals

Sort intervals by start time, then merge overlapping ones by checking if the current interval's start is before the previous interval's end.

**When to use it:** Any problem involving overlapping intervals, scheduling, or time ranges.

**Classic problems:** Merge Intervals, Insert Interval, Meeting Rooms II.

## 5. Cyclic Sort

When you have n numbers in a range [1, n] (or [0, n-1]), place each number at its correct index using swaps. Then scan for misplaced elements.

**When to use it:** Finding missing numbers, duplicate numbers, or smallest missing positive in an array with numbers in a known range.

**Classic problems:** Find the Missing Number, Find All Duplicates in an Array.

## 6. In-Place Reversal of a Linked List

Reverse a linked list (or a portion of it) using three pointers: prev, current, next.

**When to use it:** Any problem asking you to reverse a linked list or reverse a sublist without extra space.

**Classic problems:** Reverse a Linked List, Reverse a Sub-list, Reverse Every K-element Sub-list.

## 7. Tree BFS (Breadth-First Search)

Use a queue to traverse a tree level by level. Process all nodes at depth d before any node at depth d+1.

**When to use it:** Level-order traversal, finding the shortest path in an unweighted graph, anything requiring "level by level" processing.

**Classic problems:** Binary Tree Level Order Traversal, Zigzag Level Order Traversal, Minimum Depth of Binary Tree.

## 8. Tree DFS (Depth-First Search)

Use recursion (or an explicit stack) to traverse a tree depth-first — pre-order, in-order, or post-order.

**When to use it:** Path problems, subtree problems, tree construction, anything requiring full traversal before returning a result.

**Classic problems:** Path Sum, All Paths for a Sum, Diameter of Binary Tree.

## 9. Two Heaps

Maintain two heaps — a max-heap for the lower half and a min-heap for the upper half. The median is always at the tops of these heaps.

**When to use it:** Finding the median of a data stream, scheduling problems where you need to track both smallest and largest halves.

**Classic problems:** Find the Median from Data Stream, Sliding Window Median.

## 10. Subsets / Backtracking

Build the solution incrementally by exploring all possibilities. At each step, add an element or skip it. Prune branches that can't lead to valid solutions.

**When to use it:** Generate all subsets, permutations, combinations, or strings that match a pattern. If the problem asks "find all…", backtracking is likely the answer.

**Classic problems:** Subsets, Permutations, Combination Sum, N-Queens.

## 11. Modified Binary Search

Binary search isn't just for sorted arrays. Recognize when the search space can be halved based on some property.

**When to use it:** Rotated sorted arrays, finding a peak, binary searching on the answer (e.g., "find the minimum capacity such that…").

**Classic problems:** Search in Rotated Sorted Array, Find Minimum in Rotated Sorted Array, Koko Eating Bananas.

## 12. Top K Elements

Use a min-heap of size K. Push elements in; when size exceeds K, pop the minimum. What remains is the K largest elements.

**When to use it:** "Find K largest/smallest/most frequent elements." Heap gives O(n log k) vs O(n log n) for full sort.

**Classic problems:** Top K Frequent Elements, Kth Largest Element in an Array, K Closest Points to Origin.

## 13. K-way Merge

Use a min-heap to merge K sorted lists. Push the first element of each list, then repeatedly pop the minimum and push the next element from the same list.

**When to use it:** Merging K sorted arrays, finding the Kth smallest element across K sorted lists.

**Classic problems:** Merge K Sorted Lists, Kth Smallest Number in M Sorted Lists.

## 14. Dynamic Programming

Break a problem into overlapping subproblems. Store results of subproblems to avoid redundant computation (memoization or tabulation).

**When to use it:** Optimization problems ("minimum cost", "maximum profit"), counting problems ("how many ways"), decision problems with optimal substructure.

**Classic problems:** Fibonacci, 0/1 Knapsack, Longest Common Subsequence, Coin Change.

---

## How to Use These Patterns in Practice

When you see a new problem, run through this checklist:

1. **Is the input sorted?** → Two Pointers, Modified Binary Search, or Merge Intervals
2. **Is it a linked list?** → Fast/Slow Pointers, In-Place Reversal
3. **Is it a tree or graph?** → BFS or DFS
4. **Do you need K largest/smallest?** → Heap (Top K or Two Heaps)
5. **Are you looking for all combinations/subsets?** → Backtracking
6. **Does it involve overlapping subproblems?** → Dynamic Programming
7. **Is there a contiguous subarray condition?** → Sliding Window

The goal isn't to memorize these — it's to internalize the _shape_ of problems that each pattern solves. After you solve 3-5 problems in each category, the pattern recognition becomes automatic.

That's what sophocode is built for: deliberate practice by pattern, with an AI coach that explains _why_ each approach works.
