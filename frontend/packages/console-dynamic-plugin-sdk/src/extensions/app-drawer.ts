import type { ComponentType } from 'react';
import type { Extension, CodeRef } from '../types';

/** Props passed by the Console to an app drawer panel component. */
export type AppDrawerPanelProps = {
  /** Collapses the drawer. */
  onClose: () => void;
};

/**
 * Adds a side panel rendered as a Drawer that wraps the Console page and pushes its
 * content aside when open. The open state is controlled by plugins via the `useAppDrawer` hook.
 */
export type AppDrawer = Extension<
  'console.app/drawer',
  {
    /** A unique identifier used to open, close, or toggle this drawer via `useAppDrawer`. */
    id: string;
    /** The panel component rendered inside the Drawer. */
    panel: CodeRef<ComponentType<AppDrawerPanelProps>>;
    /** Default size of the panel as a CSS value (e.g. `35%` or `28rem`). */
    defaultSize?: string;
    /** Minimum size of the panel as a CSS value when it is resized. */
    minSize?: string;
    /** Whether the panel can be resized by dragging. Defaults to `true`. */
    isResizable?: boolean;
  }
>;

// Type guards

export const isAppDrawer = (e: Extension): e is AppDrawer => e.type === 'console.app/drawer';
