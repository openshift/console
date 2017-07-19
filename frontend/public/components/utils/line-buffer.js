// Match each chunk of data ending with a newline or EOF, and not
// containing a newline (a logical "line")
const LINE_PATTERN = /[^\n]+(?:\n|$)/g;

export const lineBuffer = (maxSize) => {
  let buffer = [];

  return {
    totalLineCount: 0,
    maxSize: maxSize,
    clear: function() {
      buffer.splice(0, buffer.length);
    },
    push: function(data) {
      if (data === '') {
        return;
      }

      let overflow = 0;
      let lines = data.match(LINE_PATTERN);
      let trailer = buffer.pop() || '';

      if (trailer.substr(-1) !== '\n') {
        trailer = trailer + (lines.shift() || '');
        if (trailer !== '') {
          this.totalLineCount = this.totalLineCount + 1;
        }
      }

      this.totalLineCount = this.totalLineCount + lines.length;

      buffer.push(trailer);
      buffer = buffer.concat(lines);
      overflow = buffer.length - maxSize;
      if (overflow > 0) {
        buffer.splice(0, overflow);
      }
    },
    lines: function() {
      return buffer;
    }
  };
};
