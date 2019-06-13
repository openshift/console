import { createContext, ReactNode } from 'react';

export interface SvgDefsContextProps {
  addDef(id: string, node: ReactNode): void;
  removeDef(id: string): void;
}

const SvgDefsContext = createContext<SvgDefsContextProps>(undefined);

export default SvgDefsContext;
