import { Action } from '@console/dynamic-plugin-sdk';
import { KebabMenuOption, KebabSubMenuOption } from './kebab-types';

export const kebabActionsToMenu = (actions: Action[]): KebabMenuOption[] => {
  const subs: { [key: string]: KebabSubMenuOption } = {};
  const menuOptions: KebabMenuOption[] = [];

  actions.forEach((o) => {
    if (!o.disabled) {
      if (o.path) {
        const parts = o.path.split('/');
        parts.forEach((p, i) => {
          let subMenu = subs[p];
          if (!subs[p]) {
            subMenu = {
              id: `${o.id}-${p}`,
              label: p,
              children: [],
            };
            subs[p] = subMenu;
            if (i === 0) {
              menuOptions.push(subMenu);
            } else {
              subs[parts[i - 1]].children.push(subMenu);
            }
          }
        });
        subs[parts[parts.length - 1]].children.push(o);
      } else {
        menuOptions.push(o);
      }
    }
  });
  return menuOptions;
};

export const isKebabSubMenu = (option: KebabMenuOption): option is KebabSubMenuOption => {
  // only a sub menu has children
  return Array.isArray((option as KebabSubMenuOption).children);
};
