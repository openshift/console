import { CustomJSONLexer } from '../lexers';

describe('CustomJSONLexer', () => {
  it('should fail gracefully with invalid JSON', () => {
    expect(new CustomJSONLexer().extract('{"key": "%test%", invalid}', 'test.json')).toEqual([]);
  });

  it('should parse strings matching pattern `^%.+%$`', () => {
    expect(
      new CustomJSONLexer().extract(
        '{"nope": false, "foo": "%bar%", "test": ["%arr1%", "%arr2%", "arr3"]}',
        'test.json',
      ),
    ).toEqual([{ key: 'bar' }, { key: 'arr1' }, { key: 'arr2' }]);
  });

  it('should parse json with comments', () => {
    expect(
      new CustomJSONLexer().extract(
        `{"nope": false,
        // comment
        "foo": "%bar%", "test": ["%arr1%",
        // comment
        "%arr2%", "arr3"]}`,
        'test.json',
      ),
    ).toEqual([{ key: 'bar' }, { key: 'arr1' }, { key: 'arr2' }]);
  });
});
