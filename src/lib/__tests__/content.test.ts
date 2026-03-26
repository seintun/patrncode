import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getAllPosts, getPostBySlug } from '../content';

const TMP_DIR = path.join(os.tmpdir(), 'content-test-' + process.pid);
const BLOG_DIR = path.join(TMP_DIR, 'src', 'content', 'blog');
const DOCS_DIR = path.join(TMP_DIR, 'src', 'content', 'docs');

// Override process.cwd() for tests
const originalCwd = process.cwd;
beforeAll(() => {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(BLOG_DIR, 'post-a.md'),
    `---\ntitle: Post A\ndescription: Desc A\npublishedAt: "2026-03-10"\n---\nContent A`,
  );
  fs.writeFileSync(
    path.join(BLOG_DIR, 'post-b.md'),
    `---\ntitle: Post B\ndescription: Desc B\npublishedAt: "2026-03-01"\ntags:\n  - patterns\n---\nContent B`,
  );
  fs.writeFileSync(
    path.join(DOCS_DIR, 'getting-started.md'),
    `---\ntitle: Getting Started\ndescription: A guide\npublishedAt: "2026-02-01"\n---\nDoc content`,
  );

  process.cwd = () => TMP_DIR;
});

afterAll(() => {
  process.cwd = originalCwd;
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('getAllPosts', () => {
  it('returns posts sorted by publishedAt descending', () => {
    const posts = getAllPosts('blog');
    expect(posts).toHaveLength(2);
    expect(posts[0].frontmatter.publishedAt).toBe('2026-03-10');
    expect(posts[1].frontmatter.publishedAt).toBe('2026-03-01');
  });

  it('parses frontmatter correctly', () => {
    const posts = getAllPosts('blog');
    expect(posts[0].slug).toBe('post-a');
    expect(posts[0].frontmatter.title).toBe('Post A');
    expect(posts[0].frontmatter.description).toBe('Desc A');
  });

  it('parses optional tags field', () => {
    const posts = getAllPosts('blog');
    const postB = posts.find((p) => p.slug === 'post-b');
    expect(postB?.frontmatter.tags).toEqual(['patterns']);
  });

  it('returns docs posts when type is docs', () => {
    const docs = getAllPosts('docs');
    expect(docs).toHaveLength(1);
    expect(docs[0].slug).toBe('getting-started');
  });

  it('returns empty array when directory does not exist', () => {
    const posts = getAllPosts('blog');
    // Remove dir and test
    fs.rmSync(BLOG_DIR, { recursive: true, force: true });
    const empty = getAllPosts('blog');
    expect(empty).toEqual([]);
    // Restore for other tests
    fs.mkdirSync(BLOG_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(BLOG_DIR, 'post-a.md'),
      `---\ntitle: Post A\ndescription: Desc A\npublishedAt: "2026-03-10"\n---\nContent A`,
    );
    fs.writeFileSync(
      path.join(BLOG_DIR, 'post-b.md'),
      `---\ntitle: Post B\ndescription: Desc B\npublishedAt: "2026-03-01"\ntags:\n  - patterns\n---\nContent B`,
    );
    void posts;
  });
});

describe('getPostBySlug', () => {
  it('returns the correct post by slug', () => {
    const post = getPostBySlug('post-a', 'blog');
    expect(post).not.toBeNull();
    expect(post?.slug).toBe('post-a');
    expect(post?.frontmatter.title).toBe('Post A');
    expect(post?.content.trim()).toBe('Content A');
  });

  it('returns null for a non-existent slug', () => {
    const post = getPostBySlug('does-not-exist', 'blog');
    expect(post).toBeNull();
  });

  it('returns docs post by slug', () => {
    const post = getPostBySlug('getting-started', 'docs');
    expect(post?.frontmatter.title).toBe('Getting Started');
  });
});
