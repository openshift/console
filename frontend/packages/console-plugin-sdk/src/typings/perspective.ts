import * as React from 'react';
import { Extension } from '.';

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
    /** Whether the perspective is the default. There can only be one default. */
    default?: boolean;
  }
}

export interface Perspective extends Extension<ExtensionProperties.Perspective> {
  type: 'Perspective';
}

export const isPerspective = (e: Extension<any>): e is Perspective => {
  return e.type === 'Perspective';
};
