import * as React from 'react';
// import { FocusTrap } from '@patternfly/react-core';
// import { AngleRightIcon } from '@patternfly/react-icons';
// import * as classNames from 'classnames';
import { KebabOption } from '../../../extensions/console-types';

// TO DO: finish migration ob kebab components & utils

export const kebabOptionsToMenu = (options: KebabOption[]): KebabMenuOption[] => {
  const subs: { [key: string]: KebabSubMenu } = {};
  const menuOptions: KebabMenuOption[] = [];

  options.forEach((o) => {
    if (!o.hidden) {
      if (o.pathKey || o.path) {
        const parts = o.pathKey ? o.pathKey.split('/') : o.path.split('/');
        parts.forEach((p, i) => {
          let subMenu = subs[p];
          if (!subs[p]) {
            subMenu = o.pathKey
              ? {
                  labelKey: p,
                  children: [],
                }
              : {
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

// type KebabMenuItemsProps = {
//   options: KebabMenuOption[];
//   onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
//   focusItem?: KebabOption;
//   className?: string;
// };

// export const KebabMenuItems: React.FC<KebabMenuItemsProps> = ({
//   className,
//   options,
//   onClick,
//   focusItem,
// }) => (
//   <ul
//     className={classNames('pf-c-dropdown__menu pf-m-align-right', className)}
//     data-test-id="action-items"
//   >
//     {_.map(options, (o, index) => (
//       <li key={index}>
//         {isKebabSubMenu(o) ? (
//           <KebabSubMenu option={o} onClick={onClick} />
//         ) : (
//           <KebabItem
//             option={o}
//             onClick={onClick}
//             autoFocus={focusItem ? o === focusItem : undefined}
//           />
//         )}
//       </li>
//     ))}
//   </ul>
// );

type KebabSubMenu = {
  label?: string;
  labelKey?: string;
  children: KebabMenuOption[];
};

export type KebabMenuOption = KebabSubMenu | KebabOption;

type KebabSubMenuProps = {
  option: KebabSubMenu;
  onClick: KebabItemProps['onClick'];
};

// const KebabSubMenu: React.FC<KebabSubMenuProps> = ({ option, onClick }) => {
//   const { t } = useTranslation();
//   const [open, setOpen] = React.useState(false);
//   const nodeRef = React.useRef(null);
//   const subMenuRef = React.useRef(null);
//   const referenceCb = React.useCallback(() => nodeRef.current, []);
//   // use a callback ref because FocusTrap is old and doesn't support non-function refs
//   const subMenuCbRef = React.useCallback((node) => (subMenuRef.current = node), []);

//   return (
//     <>
//       <button
//         ref={nodeRef}
//         className="oc-kebab__sub pf-c-dropdown__menu-item"
//         data-test-action={option.labelKey || option.label}
//         // mouse enter will open the sub menu
//         onMouseEnter={() => setOpen(true)}
//         onMouseLeave={(e) => {
//           // if the mouse leaves this item, close the sub menu only if the mouse did not enter the sub menu itself
//           if (!subMenuRef.current || !subMenuRef.current.contains(e.relatedTarget as Node)) {
//             setOpen(false);
//           }
//         }}
//         onKeyDown={(e) => {
//           // open the sub menu on enter or right arrow
//           if (e.keyCode === 39 || e.keyCode === 13) {
//             setOpen(true);
//             e.stopPropagation();
//           }
//         }}
//       >
//         {option.labelKey ? t(option.labelKey) : option.label}
//         <AngleRightIcon className="oc-kebab__arrow" />
//       </button>
//       <Popper
//         open={open}
//         placement="right-start"
//         closeOnEsc
//         closeOnOutsideClick
//         onRequestClose={(e) => {
//           // only close the sub menu if clicking anywhere outside the menu item that owns the sub menu
//           if (!e || !nodeRef.current || !nodeRef.current.contains(e.target as Node)) {
//             setOpen(false);
//           }
//         }}
//         reference={referenceCb}
//       >
//         <FocusTrap
//           focusTrapOptions={{
//             clickOutsideDeactivates: true,
//             fallbackFocus: () => subMenuRef.current, // fallback to popover content wrapper div if there are no tabbable elements
//           }}
//         >
//           <div
//             ref={subMenuCbRef}
//             role="presentation"
//             className="pf-c-dropdown pf-m-expanded"
//             tabIndex={-1}
//             onMouseLeave={(e) => {
//               // only close the sub menu if the mouse does not enter the item
//               if (!nodeRef.current || !nodeRef.current.contains(e.relatedTarget as Node)) {
//                 setOpen(false);
//               }
//             }}
//             onKeyDown={(e) => {
//               // close the sub menu on left arrow
//               if (e.keyCode === 37) {
//                 setOpen(false);
//                 e.stopPropagation();
//               }
//             }}
//           >
//             <KebabMenuItems
//               options={option.children}
//               onClick={onClick}
//               className="oc-kebab__popper-items"
//               focusItem={option.children[0]}
//             />
//           </div>
//         </FocusTrap>
//       </Popper>
//     </>
//   );
// };

export const isKebabSubMenu = (option: KebabMenuOption): option is KebabSubMenu => {
  // only a sub menu has children
  return Array.isArray((option as KebabSubMenu).children);
};

export type KebabItemsProps = {
  options: KebabOption[];
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  focusItem?: KebabOption;
  className?: string;
};

export const KebabItems: React.FC<KebabItemsProps> = ({ options, ...props }) => {
  const menuOptions = kebabOptionsToMenu(options);
  return <KebabMenuItems {...props} options={menuOptions} />;
};

KebabItems.displayName = 'KebabItems';

export type KebabItemProps = {
  option: KebabOption;
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  autoFocus?: boolean;
  onEscape?: () => void;
};
