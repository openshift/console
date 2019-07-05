import * as React from 'react';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface Perspective {
    /** The perspective identifier. */
    id: string;
    /** The perspective display name. */
    name: string;
    /** The perspective display icon. */
    icon: React.ReactElement;
    /** The perspective landing page URL. */
    landingPageURL: string;
    /** The perspective landing page URL. */
    k8sLandingPageURL: string;
    /** Whether the perspective is the default. There can only be one default. */
    default?: boolean;
    /** The function to get redirect URL for import flow. */
    getImportRedirectURL: (project: string) => string;
  }
}

export interface Perspective extends Extension<ExtensionProperties.Perspective> {
  type: 'Perspective';
}

export const isPerspective = (e: Extension<any>): e is Perspective => {
  return e.type === 'Perspective';
};
