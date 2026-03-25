import { createContext } from 'react';
import type { ImageStreamContextProps } from '../import-types';

export const ImageStreamContext = createContext<ImageStreamContextProps>(undefined as any);
