import { Extension } from '@console/plugin-sdk';

export const getFlagsForExtensions = (extensions: Extension<{required: string}>[]): string[] =>
  extensions.map(e => e.properties.required).filter((value, index, self) => self.indexOf(value) === index);
