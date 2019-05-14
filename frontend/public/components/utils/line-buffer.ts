export const LINE_PATTERN = /^.*(\n|$)/gm;

export class LineBuffer {

  private _maxSize: number
  private _buffer: string[]
  private _tail: string

  constructor(maxSize) {
    this._maxSize = maxSize;
    this._buffer = [];
    this._tail = '';
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

  getBlob(options): Blob {
    return new Blob([this._buffer.join('')], options);
  }

  length(): number {
    return this._buffer.length;
  }
}
