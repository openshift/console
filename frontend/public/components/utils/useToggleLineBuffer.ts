import * as React from 'react';
import { LineBuffer } from './line-buffer';

const useToggleLineBuffer = (bufferSize: number | null) => {
  const buffer = React.useRef<LineBuffer | null>(null);
  React.useEffect(() => {
    buffer.current = new LineBuffer(bufferSize || 0);
  }, [bufferSize]);

  return buffer;
};

export default useToggleLineBuffer;
