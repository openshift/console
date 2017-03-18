import { lineBuffer } from '../public/components/utils/line-buffer';

describe('lineBuffer', function() {
  var buffer;

  beforeEach(function() {
    buffer = lineBuffer(3);
  });

  it('should allow no newlines', function() {
    buffer.push('No newline');
    expect(buffer.lines()).toEqual(['No newline']);
  });

  it('should ignore empty data', function() {
    buffer.push('');
    expect(buffer.lines()).toEqual([]);
  });

  it('should split newlines', function() {
    buffer.push('Line one\nline two');
    expect(buffer.lines()).toEqual(['Line one\n', 'line two']);
  });

  it('should preserve trailing newlines', function() {
    buffer.push('Line one\nline two\n');
    expect(buffer.lines()).toEqual(['Line one\n', 'line two\n']);
  });

  it('should only preserve trailing lines', function() {
    buffer.push('Line one\nline two\nline three\nline four\n');
    expect(buffer.lines()).toEqual(['line two\n', 'line three\n', 'line four\n']);
  });

  it('should stay the same size across multiple pushes', function() {
    buffer.push('Line one\nline two\nline three\n');
    buffer.push('shove one\nshove two\n');
    expect(buffer.lines()).toEqual(['line three\n', 'shove one\n', 'shove two\n']);
  });

  it('should merge trailing line fragments', function() {
    buffer.push('one ');
    buffer.push('two ');
    buffer.push('three ');
    buffer.push('four');
    expect(buffer.lines()).toEqual(['one two three four']);
  });

  it('should not merge trailing lines', function() {
    buffer.push('one\n');
    buffer.push('two\n');
    buffer.push('three');
    expect(buffer.lines()).toEqual(['one\n', 'two\n', 'three']);
  });
});
