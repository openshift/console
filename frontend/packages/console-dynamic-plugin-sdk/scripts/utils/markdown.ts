/**
 * Matches inline links (inline-level structure).
 *
 * Image links `![name](target)` are included since we want to cover all inline links.
 *
 * ```markdown
 * [release notes](./release-notes)
 * ```
 *
 * @see https://spec.commonmark.org/0.31.2/#inline-link
 */
const inlineLinkPattern = /\[[^\]]*\]\((\.\.?\/[^)]*)\)/gm;

/**
 * Matches link reference definitions (block-level structure).
 *
 * While the CommonMark spec permits up to 3 spaces of indentation, we disallow leading spaces
 * for consistency across all documents.
 *
 * ```markdown
 * [link reference]: ./docs/test.md
 * ```
 *
 * @see https://spec.commonmark.org/0.31.2/#link-reference-definition
 */
const referenceLinkPattern = /^\[[^\]]+\]:\s*(\.\.?\/\S*)/gm;

/**
 * Rewrite Markdown links that use relative paths.
 *
 * Covers both inline links and link reference definitions whose target has `./` or `../` prefix.
 */
export const rewriteRelativePathLinks = (
  content: string,
  getURL: (relativePath: string) => string,
) => {
  let output = content;

  [inlineLinkPattern, referenceLinkPattern].forEach((pattern) => {
    for (const match of content.matchAll(pattern)) {
      const [fullMatch, relativePath] = match;
      const targetIndex = fullMatch.lastIndexOf(relativePath);
      const rewrittenMatch =
        fullMatch.slice(0, targetIndex) +
        getURL(relativePath) +
        fullMatch.slice(targetIndex + relativePath.length);

      output = output.replaceAll(fullMatch, rewrittenMatch);
    }
  });

  return output;
};
