import type { ExtensionK8sModel, K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';

export type CommandPaletteCommand =
  | {
      type: 'page';
      id: string;
      title: string;
      aliases: string[];
      keywords: string[];
      section?: string;
      perspective: string;
      href: string;
      navModel?: Pick<ExtensionK8sModel, 'group' | 'kind'>;
    }
  | {
      type: 'resource';
      id: string;
      title: string;
      aliases: string[];
      keywords: string[];
      model: K8sModel;
      href: string;
    }
  | {
      type: 'namespace';
      id: string;
      title: string;
      aliases: string[];
      keywords: string[];
      namespace: string;
    };

export type CommandPaletteCommandType = CommandPaletteCommand['type'];

export type CommandPaletteGroup = {
  type: CommandPaletteCommandType;
  commands: CommandPaletteCommand[];
};
