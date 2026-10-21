import type { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import type { CodeRef } from '@console/dynamic-plugin-sdk/src/types';

export type AddGroup = {
  id: string;
  name: string;
  items: ResolvedExtension<AddAction>[];
  icon?: CodeRef<React.ReactNode> | string;
};
