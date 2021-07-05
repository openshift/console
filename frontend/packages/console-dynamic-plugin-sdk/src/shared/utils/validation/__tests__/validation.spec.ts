import { alignWithDNS1123 } from '../validation';

describe('alignWithDNS1123', () => {
  it('aligns with DNS1123', () => {
    expect(alignWithDNS1123('https://my.host.com')).toBe('httpsmy-host-com');
    expect(alignWithDNS1123(' my.host.com')).toBe('my-host-com');
    expect(alignWithDNS1123('-my-host;')).toBe('my-host');
    expect(alignWithDNS1123('-my-72host;')).toBe('my-72host');
    expect(alignWithDNS1123(' @#$_#*($%-my-[];.1@##@%2#-host;   ')).toBe('my--12-host');
  });

  it('does not change original', () => {
    ['my-host', 'm', '12-my-host-123', 'my-12host'].forEach((value) =>
      expect(alignWithDNS1123(value)).toBe(value),
    );
  });

  it('return empty string', () => {
    [' @#$_#*($%-[];.##@%#;   ', '', null, undefined, '-----', '   '].forEach((value) =>
      expect(alignWithDNS1123(value)).toBe(''),
    );
  });

  it('cuts max length', () => {
    expect(alignWithDNS1123('x'.repeat(253))).toBe('x'.repeat(253));
    expect(alignWithDNS1123(`  ${'x'.repeat(254)}`)).toBe('x'.repeat(253));
    expect(alignWithDNS1123(`----  ${'x'.repeat(1050)}`)).toBe('x'.repeat(253));
  });
});
