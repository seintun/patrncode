import { cn } from '../utils';

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts — last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
  });

  it('handles undefined', () => {
    expect(cn('foo', undefined)).toBe('foo');
  });

  it('handles null', () => {
    expect(cn('foo', null)).toBe('foo');
  });

  it('handles object notation — includes truthy, excludes falsy', () => {
    expect(cn({ active: true, hidden: false })).toBe('active');
  });

  it('returns empty string for empty call', () => {
    expect(cn()).toBe('');
  });
});
