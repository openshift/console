import * as React from 'react';
import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

// Align type with React.lazy
type LazyComponent = { default: React.ComponentType };

/** This extension contributes a new perspective to the console which enables customization of the navigation menu. */
export type Perspective = ExtensionDeclaration<
  'console.perspective',
  {
    /** The perspective identifier. */
    id: string;
    /** The perspective display name. */
    name: string;
    /** The perspective display icon. */
    icon: CodeRef<LazyComponent>;
    /** Whether the perspective is the default. There can only be one default. */
    default?: boolean;
    /** Default pinned resources on the nav */
    defaultPins?: ExtensionK8sModel[];
    /** The function to get perspective landing page URL. */
    landingPageURL: CodeRef<(flags: { [key: string]: boolean }, isFirstVisit: boolean) => string>;
    /** The function to get a relative redirect URL for import flow. */
    importRedirectURL: CodeRef<(namespace: string) => string>;
    /** The hook to detect default perspective */
    usePerspectiveDetection?: CodeRef<() => [boolean, boolean]>; // [enablePerspective: boolean, loading: boolean]
  }
>;

export const isPerspective = (e: Extension): e is Perspective => {
  return e.type === 'console.perspective';
};
