import * as _ from 'lodash';
export const LINE_PATTERN = /^.*(\n|$)/gm;

export class LineBuffer {
  private _maxSize: number;
  private _buffer: string[];
  private _tail: string;
  private _hasTruncated: boolean;

  constructor(maxSize) {
    this._maxSize = maxSize;
    this._buffer = [];
    this._tail = '';
    this._hasTruncated = false;
  }

  ingest(text): number {
    const lines = text.match(LINE_PATTERN);
    let lineCount = 0;
    lines.forEach((line) => {
      const next = `${this._tail}${line}`;
      if (/\n$/.test(line)) {
        if (this._buffer.length === this._maxSize) {
          this._buffer.shift();
        }
        const truncated = _.truncate(next, { length: 1024 });
        if (truncated.length !== next.length) {
          this._hasTruncated = true;
        }
        this._buffer.push(truncated.trimEnd());
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
    this._hasTruncated = false;
    this._tail = '';
  }

  getLines(): string[] {
    return this._buffer;
  }

  getBlob(options): Blob {
    return new Blob([this._buffer.join('')], options);
  }

  getHasTruncated(): boolean {
    return this._hasTruncated;
  }

  length(): number {
    return this._buffer.length;
  }
}
