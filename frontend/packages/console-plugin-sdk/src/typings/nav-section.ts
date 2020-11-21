import { Extension } from './base';

namespace ExtensionProperties {
  export interface NavSection {
    /** Section id, should be unique for all sections (and top level items) */
    id: string;
    /** Perspective id to which this section belongs to. If not specified, use the default perspective. */
    perspective?: string;
    /** Title for the section, if none only a separator will be shown above the section */
    name?: string;
    /** Nav section before which this section should be placed. For arrays, first one found in order is used */
    insertBefore?: string | string[];
    /** Nav section after which this section should be placed (before takes precedence). For arrays, first one found in order is used */
    insertAfter?: string | string[];
  }
}

export interface NavSection extends Extension<ExtensionProperties.NavSection> {
  type: 'Nav/Section';
}

export const isNavSection = (e: Extension): e is NavSection => {
  return e.type === 'Nav/Section';
};
