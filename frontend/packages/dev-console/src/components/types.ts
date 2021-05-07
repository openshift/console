import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';

export type AddGroup = {
  id: string;
  name: string;
  items: ResolvedExtension<AddAction>[];
};
