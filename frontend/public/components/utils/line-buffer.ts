import * as _ from 'lodash';

export const LINE_PATTERN = /^.*(\n|$)/gm;

export class LineBuffer {

  /* eslint-disable no-undef */
  private _maxSize: number
  private _buffer: string[]
  private _tail: string
  /* eslint-enable no-undef */

  constructor(maxSize) {
    this._maxSize = maxSize;
    this._buffer = [];
    this._tail = '';
  }

  ingest(text): number {
    const lines = text.match(LINE_PATTERN);
    let lineCount = 0;
    _.each(lines, (line) => {
      let next = `${this._tail}${line}`;
      if (/\n$/.test(line)) {
        if (this._buffer.length === this._maxSize) {
          this._buffer.shift();
        }
        this._buffer.push(next);
        lineCount++;
        this._tail = '';
      } else {
        this._tail = next;
      }
    });
    return lineCount;
  }

  clear(): void {
    this._buffer = [];
  }

  getLines(): string[] {
    return this._buffer;
  }

  length(): number {
    return this._buffer.length;
  }
}
