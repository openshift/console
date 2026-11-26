import { createContext, useCallback, useContext } from 'react';
import type { UseAppDrawer } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export type AppDrawerContextValue = {
  /** Ids of the drawers that are currently open. */
  openDrawerIds: string[];
  /** Opens or closes the drawer with the given id. */
  setDrawerOpen: (id: string, open: boolean) => void;
};

export const AppDrawerContext = createContext<AppDrawerContextValue>({
  openDrawerIds: [],
  setDrawerOpen: (id) => {
    console.warn(`useAppDrawer('${id}') was called outside of AppDrawerHost and has no effect`);
  },
});

export const useAppDrawer: UseAppDrawer = (id) => {
  const { openDrawerIds, setDrawerOpen } = useContext(AppDrawerContext);
  const isOpen = openDrawerIds.includes(id);

  const open = useCallback(() => setDrawerOpen(id, true), [id, setDrawerOpen]);
  const close = useCallback(() => setDrawerOpen(id, false), [id, setDrawerOpen]);
  const toggle = useCallback(() => setDrawerOpen(id, !isOpen), [id, isOpen, setDrawerOpen]);

  return { isOpen, open, close, toggle };
};
