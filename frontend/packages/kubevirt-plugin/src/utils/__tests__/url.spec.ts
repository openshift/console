import { resolveOrigin, resolvePathname, resolveURL } from '../url';

const urlObj = new URL(
  'http://rock.mountain.all-images.cz/mirrors/there-was-a-toad/on/a/blue/happy/road/0.12.13/isos/x86_64/dromaeosauridae.iso?a=1&b=caaaaaaaaaaddddddddaaaaaaa#here',
);
const urlObjWithPort = new URL(
  'http://rock.mountain.all-images.cz:12345/mirrors/there-was-a-toad/on/a/blue/happy/road/0.12.13/isos/x86_64/dromaeosauridae.iso?a=1&b=caaaaaaaaaaddddddddaaaaaaa#here',
);

describe('resolveOrigin', () => {
  test('return origin', () => {
    expect(resolveOrigin(urlObj, 4)).toMatch('http://rock.mountain.all-images.cz');
  });
  test('return origin with port', () => {
    expect(resolveOrigin(urlObjWithPort, 5)).toMatch('http://rock.mountain.all-images.cz:12345');
  });
  test('return resolved URL', () => {
    expect(resolveOrigin(urlObj, 3)).toMatch('…mountain.all-images.cz');
  });
  test('return resolved URL with port', () => {
    expect(resolveOrigin(urlObjWithPort, 2)).toMatch('…all-images.cz:12345');
  });
});

describe('resolvePathname', () => {
  test('resolve to full path', () => {
    expect(resolvePathname(urlObj, 11)).toMatch(
      '/mirrors/there-was-a-toad/on/a/blue/happy/road/0.12.13/isos/x86_64/dromaeosauridae.iso',
    );
  });
  test('resolve to partial path', () => {
    expect(resolvePathname(urlObj, 8)).toMatch(
      '/…/a/blue/happy/road/0.12.13/isos/x86_64/dromaeosauridae.iso',
    );
  });
});

describe('resolveURL', () => {
  test('return full URL with full path', () => {
    expect(resolveURL({ urlObj, maxHostnameParts: 4, maxPathnameParts: 11 })).toMatch(
      'http://rock.mountain.all-images.cz/mirrors/there-was-a-toad/on/a/blue/happy/road/0.12.13/isos/x86_64/dromaeosauridae.iso',
    );
  });
  test('return full URL with partial path', () => {
    expect(resolveURL({ urlObj, maxHostnameParts: 4, maxPathnameParts: 1 })).toMatch(
      'http://rock.mountain.all-images.cz/…/dromaeosauridae.iso',
    );
  });
  test('return partial URL with partial path', () => {
    expect(resolveURL({ urlObj, maxHostnameParts: 3, maxPathnameParts: 1 })).toMatch(
      '…mountain.all-images.cz/…/dromaeosauridae.iso',
    );
  });
});
