import * as React from 'react';
import { FlagsObject } from '@console/shared/src/hocs/connect-flags';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface Perspective {
    /** The perspective identifier. */
    id: string;
    /** The perspective display name. */
    name: string;
    /** The perspective display icon. */
    icon: React.ReactElement;
    /** Whether the perspective is the default. There can only be one default. */
    default?: boolean;
    /** Default pinned resources on the nav */
    defaultPins?: string[];
    /** The function to get perspective landing page URL. */
    getLandingPageURL: GetLandingPage;
    /** The function to get perspective landing page URL for k8s. */
    getK8sLandingPageURL: GetLandingPage;
    /** The function to get redirect URL for import flow. */
    getImportRedirectURL: (project: string) => string;
  }
}

export interface Perspective extends Extension<ExtensionProperties.Perspective> {
  type: 'Perspective';
}

export const isPerspective = (e: Extension): e is Perspective => {
  return e.type === 'Perspective';
};

export type GetLandingPage = (flags: FlagsObject) => string;
