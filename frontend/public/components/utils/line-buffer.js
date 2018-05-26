// Match each chunk of data ending with a newline or EOF, and not
// containing a newline (a logical "line")
const LINE_PATTERN = /[^\n]+(?:\n|$)/g;

export class LineBuffer {

  constructor(maxSize){
    this.totalLineCount = 0;
    this.maxSize = maxSize;
    this.buffer = [];
  }

  clear() {
    this.buffer.splice(0, this.buffer.length);
  }

  push(data) {
    if (data === '') {
      return;
    }

    let overflow = 0;
    let lines = data.match(LINE_PATTERN) || [data];
    let trailer = this.buffer.pop() || '';

    if (trailer.substr(-1) !== '\n') {
      trailer = trailer + (lines.shift() || '');
      if (trailer !== '') {
        this.totalLineCount = this.totalLineCount + 1;
      }
    }

    this.totalLineCount = this.totalLineCount + lines.length;

    this.buffer.push(trailer);
    this.buffer = this.buffer.concat(lines);
    overflow = this.buffer.length - this.maxSize;
    if (overflow > 0) {
      this.buffer.splice(0, overflow);
    }
  }

  lines() {
    return this.buffer;
  }
}
