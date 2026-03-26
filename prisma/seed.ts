import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface TestCaseData {
  input: string;
  expected: string;
  isHidden: boolean;
  order: number;
}

interface ProblemSeed {
  title: string;
  slug: string;
  pattern: 'HASH_MAPS' | 'ARRAYS_STRINGS' | 'TWO_POINTERS' | 'BINARY_SEARCH' | 'SLIDING_WINDOW';
  difficulty: 'EASY' | 'MEDIUM';
  statement: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  starterCode: string;
  approaches: Array<{ name: string; description: string; complexity: string }>;
  testCases: TestCaseData[];
}

const problems: ProblemSeed[] = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    pattern: 'HASH_MAPS',
    difficulty: 'EASY',
    statement: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode:
      'def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Brute Force',
        description:
          'Check every pair of elements to see if they sum to the target. Simple but slow.',
        complexity: 'Time O(n²), Space O(1)',
      },
      {
        name: 'Hash Map (One-Pass)',
        description:
          'Use a hash map to store each number and its index. For each element, check if (target - element) exists in the map.',
        complexity: 'Time O(n), Space O(n)',
      },
    ],
    testCases: [
      { input: '[[2,7,11,15], 9]', expected: '[0, 1]', isHidden: false, order: 1 },
      { input: '[[3,2,4], 6]', expected: '[1, 2]', isHidden: false, order: 2 },
      { input: '[[3,3], 6]', expected: '[0, 1]', isHidden: false, order: 3 },
      { input: '[[1,5,3,7], 8]', expected: '[1, 2]', isHidden: true, order: 4 },
      { input: '[[-1,-2,-3,-4,-5], -8]', expected: '[2, 4]', isHidden: true, order: 5 },
      { input: '[[0,4,3,0], 0]', expected: '[0, 3]', isHidden: true, order: 6 },
    ],
  },
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    pattern: 'HASH_MAPS',
    difficulty: 'EASY',
    statement: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: 'true',
      },
      {
        input: 's = "rat", t = "car"',
        output: 'false',
      },
    ],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.',
    ],
    starterCode: 'def isAnagram(s: str, t: str) -> bool:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Character Count (Hash Map)',
        description:
          'Count the frequency of each character in both strings and compare the counts.',
        complexity: 'Time O(n), Space O(1) — at most 26 characters',
      },
      {
        name: 'Sorting',
        description: 'Sort both strings and check if they are equal.',
        complexity: 'Time O(n log n), Space O(n)',
      },
    ],
    testCases: [
      { input: '["anagram", "nagaram"]', expected: 'True', isHidden: false, order: 1 },
      { input: '["rat", "car"]', expected: 'False', isHidden: false, order: 2 },
      { input: '["listen", "silent"]', expected: 'True', isHidden: false, order: 3 },
      { input: '["a", "a"]', expected: 'True', isHidden: true, order: 4 },
      { input: '["ab", "ba"]', expected: 'True', isHidden: true, order: 5 },
      { input: '["hello", "world"]', expected: 'False', isHidden: true, order: 6 },
      { input: '["aab", "aba"]', expected: 'True', isHidden: true, order: 7 },
    ],
  },
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    pattern: 'HASH_MAPS',
    difficulty: 'MEDIUM',
    statement: `Given an array of strings \`strs\`, group the anagrams together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation:
          'There is no string in strs that can be rearranged to form "bat". The strings "nat" and "tan" are anagrams as they can be rearranged to form each other. The strings "ate", "eat", and "tea" are anagrams as they can be rearranged to form each other.',
      },
      {
        input: 'strs = [""]',
        output: '[[""]]',
      },
      {
        input: 'strs = ["a"]',
        output: '[["a"]]',
      },
    ],
    constraints: [
      '1 <= strs.length <= 10^4',
      '0 <= strs[i].length <= 100',
      'strs[i] consists of lowercase English letters.',
    ],
    starterCode:
      'def groupAnagrams(strs: list[str]) -> list[list[str]]:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Sorted Key Hash Map',
        description:
          'For each string, sort its characters to create a key. Group strings by their sorted key in a hash map.',
        complexity: 'Time O(n * k log k), Space O(n * k)',
      },
      {
        name: 'Character Count Key',
        description:
          'Use a character frequency tuple (count of each letter) as the hash map key instead of sorting.',
        complexity: 'Time O(n * k), Space O(n * k)',
      },
    ],
    testCases: [
      {
        input: '[["eat","tea","tan","ate","nat","bat"]]',
        expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]',
        isHidden: false,
        order: 1,
      },
      { input: '[[""]]', expected: '[[""]]', isHidden: false, order: 2 },
      { input: '[["a"]]', expected: '[["a"]]', isHidden: false, order: 3 },
      {
        input: '[["cab","tin","pew","duh","may","ill","buy","bar","max","doc"]]',
        expected:
          '[["cab"],["tin"],["pew"],["duh"],["may"],["ill"],["buy"],["bar"],["max"],["doc"]]',
        isHidden: true,
        order: 4,
      },
      {
        input: '[["ddddddddddg","dgggggggggg"]]',
        expected: '[["ddddddddddg"],["dgggggggggg"]]',
        isHidden: true,
        order: 5,
      },
      {
        input: '[["a","b","c","d","e"]]',
        expected: '[["a"],["b"],["c"],["d"],["e"]]',
        isHidden: true,
        order: 6,
      },
    ],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    pattern: 'ARRAYS_STRINGS',
    difficulty: 'EASY',
    statement: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`ith\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation:
          'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.',
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.',
      },
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    starterCode:
      'def maxProfit(prices: list[int]) -> int:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Track Min Price',
        description:
          'Keep track of the minimum price seen so far. At each day, calculate the profit if you sell today and update the max profit.',
        complexity: 'Time O(n), Space O(1)',
      },
    ],
    testCases: [
      { input: '[[7,1,5,3,6,4]]', expected: '5', isHidden: false, order: 1 },
      { input: '[[7,6,4,3,1]]', expected: '0', isHidden: false, order: 2 },
      { input: '[[1,2]]', expected: '1', isHidden: false, order: 3 },
      { input: '[[2,4,1]]', expected: '2', isHidden: true, order: 4 },
      { input: '[[3,2,6,5,0,3]]', expected: '4', isHidden: true, order: 5 },
      { input: '[[1,2,3,4,5]]', expected: '4', isHidden: true, order: 6 },
      { input: '[[5,5,5,5,5]]', expected: '0', isHidden: true, order: 7 },
    ],
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    pattern: 'ARRAYS_STRINGS',
    difficulty: 'MEDIUM',
    statement: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        output: '23',
        explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode:
      'def maxSubArray(nums: list[int]) -> int:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: "Kadane's Algorithm",
        description:
          'Track the current subarray sum. If the sum becomes negative, reset it to 0 (start a new subarray). Update the max sum at each step.',
        complexity: 'Time O(n), Space O(1)',
      },
    ],
    testCases: [
      { input: '[[-2,1,-3,4,-1,2,1,-5,4]]', expected: '6', isHidden: false, order: 1 },
      { input: '[[1]]', expected: '1', isHidden: false, order: 2 },
      { input: '[[5,4,-1,7,8]]', expected: '23', isHidden: false, order: 3 },
      { input: '[[-1]]', expected: '-1', isHidden: true, order: 4 },
      { input: '[[-2,-1]]', expected: '-1', isHidden: true, order: 5 },
      { input: '[[1,2,3,4,5]]', expected: '15', isHidden: true, order: 6 },
      { input: '[[0,0,0,0]]', expected: '0', isHidden: true, order: 7 },
    ],
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    pattern: 'TWO_POINTERS',
    difficulty: 'EASY',
    statement: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.',
      },
      {
        input: 's = " "',
        output: 'true',
        explanation:
          's is an empty string "" after removing non-alphanumeric characters. An empty string reads the same forward and backward.',
      },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    starterCode: 'def isPalindrome(s: str) -> bool:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Two Pointers',
        description:
          'Use two pointers starting from both ends, skipping non-alphanumeric characters, and comparing characters as they move inward.',
        complexity: 'Time O(n), Space O(1)',
      },
    ],
    testCases: [
      { input: '["A man, a plan, a canal: Panama"]', expected: 'True', isHidden: false, order: 1 },
      { input: '["race a car"]', expected: 'False', isHidden: false, order: 2 },
      { input: '[" "]', expected: 'True', isHidden: false, order: 3 },
      { input: '["a"]', expected: 'True', isHidden: true, order: 4 },
      { input: '["ab"]', expected: 'False', isHidden: true, order: 5 },
      { input: '["abba"]', expected: 'True', isHidden: true, order: 6 },
      { input: '["0P"]', expected: 'False', isHidden: true, order: 7 },
    ],
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    pattern: 'BINARY_SEARCH',
    difficulty: 'EASY',
    statement: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All the integers in nums are unique.',
      'nums is sorted in ascending order.',
    ],
    starterCode:
      'def search(nums: list[int], target: int) -> int:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Binary Search',
        description:
          'Maintain left and right pointers. Compare target with the middle element and narrow the search space by half each iteration.',
        complexity: 'Time O(log n), Space O(1)',
      },
    ],
    testCases: [
      { input: '[[-1,0,3,5,9,12], 9]', expected: '4', isHidden: false, order: 1 },
      { input: '[[-1,0,3,5,9,12], 2]', expected: '-1', isHidden: false, order: 2 },
      { input: '[[5], 5]', expected: '0', isHidden: false, order: 3 },
      { input: '[[1,2,3,4,5], 3]', expected: '2', isHidden: true, order: 4 },
      { input: '[[1,2,3,4,5], 1]', expected: '0', isHidden: true, order: 5 },
      { input: '[[1,2,3,4,5], 5]', expected: '4', isHidden: true, order: 6 },
      { input: '[[1,2,3,4,5], 6]', expected: '-1', isHidden: true, order: 7 },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    pattern: 'SLIDING_WINDOW',
    difficulty: 'MEDIUM',
    statement: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A **substring** is a contiguous non-empty sequence of characters within a string.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation:
          'The answer is "wke", with the length of 3. Note that the answer must be a substring, "pwke" is a subsequence and not a substring.',
      },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    starterCode:
      'def lengthOfLongestSubstring(s: str) -> int:\n    # Write your solution here\n    pass',
    approaches: [
      {
        name: 'Sliding Window with Hash Set',
        description:
          'Use two pointers to define a window. Expand the right pointer, and when a duplicate is found, shrink from the left until the window is valid again.',
        complexity: 'Time O(n), Space O(min(n, m)) where m is charset size',
      },
      {
        name: 'Sliding Window with Hash Map',
        description:
          'Store the last index of each character. When a duplicate is found, jump the left pointer directly to after the previous occurrence.',
        complexity: 'Time O(n), Space O(min(n, m))',
      },
    ],
    testCases: [
      { input: '["abcabcbb"]', expected: '3', isHidden: false, order: 1 },
      { input: '["bbbbb"]', expected: '1', isHidden: false, order: 2 },
      { input: '["pwwkew"]', expected: '3', isHidden: false, order: 3 },
      { input: '[""]', expected: '0', isHidden: true, order: 4 },
      { input: '[" "]', expected: '1', isHidden: true, order: 5 },
      { input: '["au"]', expected: '2', isHidden: true, order: 6 },
      { input: '["dvdf"]', expected: '3', isHidden: true, order: 7 },
      { input: '["abcdefg"]', expected: '7', isHidden: true, order: 8 },
    ],
  },
];

async function main() {
  console.log('Seeding problems...');

  for (const problem of problems) {
    const result = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        pattern: problem.pattern,
        difficulty: problem.difficulty,
        statement: problem.statement,
        examples: problem.examples,
        constraints: problem.constraints,
        starterCode: problem.starterCode,
        approaches: problem.approaches,
      },
      create: {
        title: problem.title,
        slug: problem.slug,
        pattern: problem.pattern,
        difficulty: problem.difficulty,
        statement: problem.statement,
        examples: problem.examples,
        constraints: problem.constraints,
        starterCode: problem.starterCode,
        approaches: problem.approaches,
      },
    });

    for (const tc of problem.testCases) {
      await prisma.testCase.create({
        data: {
          problemId: result.id,
          input: tc.input,
          expected: tc.expected,
          isHidden: tc.isHidden,
          order: tc.order,
        },
      });
    }

    console.log(`  ✓ ${problem.title} (${problem.testCases.length} test cases)`);
  }

  console.log(`\nSeeded ${problems.length} problems.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
