import { useRef, useEffect } from 'react';
import { LineBuffer } from './line-buffer';

const useToggleLineBuffer = (bufferSize: number | null) => {
  const buffer = useRef(null);
  useEffect(() => {
    buffer.current = new LineBuffer(bufferSize);
  }, [bufferSize]);

  return buffer;
};

export default useToggleLineBuffer;
