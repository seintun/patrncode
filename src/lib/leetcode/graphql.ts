// LeetCode GraphQL endpoint (public, no auth required for problem data)
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql/';

// Rate limiter: 20 requests per 10 seconds
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 20, windowMs = 10_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitMs = this.windowMs - (now - oldest) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

// GraphQL query for fetching a single problem by slug
const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      content
      difficulty
      topicTags {
        name
        slug
      }
      codeSnippets {
        lang
        langSlug
        code
      }
      hints
      exampleTestcases
    }
  }
`;

const QUESTION_LIST_QUERY = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      questions {
        frontendQuestionId
        titleSlug
      }
    }
  }
`;

// Types for LeetCode GraphQL response
export interface LeetCodeTopicTag {
  name: string;
  slug: string;
}

export interface LeetCodeCodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface LeetCodeQuestion {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  content: string | null; // HTML (can be null for locked premium questions)
  difficulty: string;
  topicTags: LeetCodeTopicTag[] | null;
  codeSnippets: LeetCodeCodeSnippet[] | null;
  hints: string[] | null;
  exampleTestcases: string;
}

export interface LeetCodeResponse {
  data: {
    question: LeetCodeQuestion | null;
  };
}

interface LeetCodeQuestionListResponse {
  data?: {
    problemsetQuestionList?: {
      questions?: Array<{
        frontendQuestionId: string;
        titleSlug: string;
      }>;
    };
  };
}

export async function fetchLeetCodeProblem(slug: string): Promise<LeetCodeQuestion> {
  await rateLimiter.wait();

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({
      query: QUESTION_QUERY,
      variables: { titleSlug: slug },
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API returned ${response.status}: ${response.statusText}`);
  }

  const json: LeetCodeResponse = await response.json();
  if (!json.data?.question) {
    throw new Error(`Problem not found: ${slug}`);
  }

  return json.data.question;
}

export async function fetchLeetCodeSlugByFrontendId(frontendId: string): Promise<string | null> {
  await rateLimiter.wait();

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({
      query: QUESTION_LIST_QUERY,
      variables: {
        categorySlug: '',
        skip: 0,
        limit: 20,
        filters: { searchKeywords: frontendId },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API returned ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as LeetCodeQuestionListResponse;
  const questions = json.data?.problemsetQuestionList?.questions ?? [];

  const match = questions.find((q) => q.frontendQuestionId === frontendId);
  return match?.titleSlug ?? null;
}
