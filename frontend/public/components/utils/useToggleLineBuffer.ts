import * as React from 'react';
import { LineBuffer } from './line-buffer';

const useToggleLineBuffer = (bufferSize: number | null) => {
  const buffer = React.useRef(null);
  React.useEffect(() => {
    buffer.current = new LineBuffer(bufferSize);
  }, [bufferSize]);

  return buffer;
};

export default useToggleLineBuffer;
