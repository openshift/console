import { Plugin, HrefNavItem, ResourceNSNavItem } from '@console/plugin-sdk';

type ConsumedExtensions = HrefNavItem | ResourceNSNavItem;

const plugin: Plugin<ConsumedExtensions> = [];

export default plugin;
