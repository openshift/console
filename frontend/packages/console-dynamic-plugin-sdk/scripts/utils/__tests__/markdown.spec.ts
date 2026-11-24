import { rewriteRelativePathLinks } from '../markdown';

describe('rewriteRelativePathLinks', () => {
  const getTestURL: Parameters<typeof rewriteRelativePathLinks>[1] = (relativePath) =>
    `https://test/${relativePath}`;

  it('covers inline links and link reference definitions', () => {
    expect(
      rewriteRelativePathLinks(
        `# Test Document

      [release notes](./release-notes)
      [./release-notes](./release-notes)

      [foo docs][foo reference]
      [bar docs][./docs/bar.md]

      ![diagram](./diagram.png)
      ![test image][img reference]

[foo reference]: ./docs/foo.md
[./docs/bar.md]: ../test/docs/bar.md
[img reference]: ../images/test.svg
    `,
        getTestURL,
      ),
    ).toEqual(
      `# Test Document

      [release notes](https://test/./release-notes)
      [./release-notes](https://test/./release-notes)

      [foo docs][foo reference]
      [bar docs][./docs/bar.md]

      ![diagram](https://test/./diagram.png)
      ![test image][img reference]

[foo reference]: https://test/./docs/foo.md
[./docs/bar.md]: https://test/../test/docs/bar.md
[img reference]: https://test/../images/test.svg
    `,
    );
  });

  it('skips links whose target does not have "./" or "../" prefix', () => {
    expect(
      rewriteRelativePathLinks(
        `# Test Document

      [release notes](#release-notes)
      [release notes](https://example.com)
      [release notes](mailto:test@example.com)

[link reference]: #test-section
[link reference]: https://example.com
[link reference]: mailto:test@example.com
    `,
        getTestURL,
      ),
    ).toEqual(
      `# Test Document

      [release notes](#release-notes)
      [release notes](https://example.com)
      [release notes](mailto:test@example.com)

[link reference]: #test-section
[link reference]: https://example.com
[link reference]: mailto:test@example.com
    `,
    );
  });

  it('skips link reference definitions with leading spaces', () => {
    expect(
      rewriteRelativePathLinks(
        `# Test Document

      [link reference]: ./docs/foo.md
      [./docs/bar.md]: ./docs/bar.md
    `,
        getTestURL,
      ),
    ).toEqual(
      `# Test Document

      [link reference]: ./docs/foo.md
      [./docs/bar.md]: ./docs/bar.md
    `,
    );
  });
});
