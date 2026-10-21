import { gitUrlRegex } from '../validation-schema';

describe('validation-schema', () => {
  describe('Git URL validation', () => {
    it('should accept valid GIT URLs', () => {
      expect(gitUrlRegex.test('https://example.com/gitproject.git')).toBe(true);
      expect(gitUrlRegex.test('https://example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('http://example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('http://example-2.com/repo-name/gitproject')).toBe(true);
      expect(gitUrlRegex.test('http://example.com:8080/gitproject')).toBe(true);
      expect(gitUrlRegex.test('ssh://example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('ssh://user@example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('ssh://user:pass@example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('git://example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('git://example/gitproject')).toBe(true);
      expect(gitUrlRegex.test('user@example.com:repo/gitproject')).toBe(true);
      expect(gitUrlRegex.test('user@example.com:repo-1/git-project')).toBe(true);
      expect(gitUrlRegex.test('user@example.com:/repo/gitproject')).toBe(true);
      expect(gitUrlRegex.test('git://example.com/gitproject')).toBe(true);
      expect(gitUrlRegex.test('git://example.com/gitproject')).toBe(true);
    });

    it('should reject invalid GIT URLs', () => {
      expect(gitUrlRegex.test('github://example.com/gitproject')).toBe(false);
      expect(gitUrlRegex.test('@example.com:gitproject')).toBe(false);
      expect(gitUrlRegex.test('example.com/gitproject')).toBe(false);
      expect(gitUrlRegex.test('http://example.com!/gitproject')).toBe(false);
      expect(gitUrlRegex.test('user@example.com!:/repo/gitproject')).toBe(false);
    });
  });
});
