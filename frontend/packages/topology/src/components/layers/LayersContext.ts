import { createContext } from 'react';

export const DEFAULT_LAYER = 'default';

type LayersContextProps = (id: string) => Element;

const LayersContext = createContext<LayersContextProps>(undefined as any);

export default LayersContext;
