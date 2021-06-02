import * as React from 'react';
import { FocusTrap } from '@patternfly/react-core';
import { AngleRightIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Action } from '@console/dynamic-plugin-sdk';
import { Popper } from '../popper';
import { KebabMenuOption, KebabSubMenuOption } from './kebab-types';
import { isKebabSubMenu } from './kebab-utils';
import KebabItem, { KebabItemProps } from './KebabItem';

type KebabMenuItemsProps = {
  options: KebabMenuOption[];
  onClick: (event: React.MouseEvent<{}>, action: Action) => void;
  focusItem?: KebabMenuOption;
  className?: string;
};

const KebabMenuItems: React.FC<KebabMenuItemsProps> = ({
  className,
  options,
  onClick,
  focusItem,
}) => (
  <ul
    className={classNames('pf-c-dropdown__menu pf-m-align-right', className)}
    data-test-id="action-items"
  >
    {_.map(options, (o, index) => (
      <li key={index}>
        {isKebabSubMenu(o) ? (
          <KebabSubMenu option={o as KebabSubMenuOption} onClick={onClick} />
        ) : (
          <KebabItem
            option={o as Action}
            onClick={onClick}
            autoFocus={focusItem ? o === focusItem : undefined}
          />
        )}
      </li>
    ))}
  </ul>
);

type KebabSubMenuProps = {
  option: KebabSubMenuOption;
  onClick: KebabItemProps['onClick'];
};

// Need to keep this in the same file to avoid circular dependency.
const KebabSubMenu: React.FC<KebabSubMenuProps> = ({ option, onClick }) => {
  const [open, setOpen] = React.useState(false);
  const nodeRef = React.useRef(null);
  const subMenuRef = React.useRef(null);
  const referenceCb = React.useCallback(() => nodeRef.current, []);
  // use a callback ref because FocusTrap is old and doesn't support non-function refs
  const subMenuCbRef = React.useCallback((node) => (subMenuRef.current = node), []);

  return (
    <>
      <button
        ref={nodeRef}
        type="button"
        className="oc-kebab__sub pf-c-dropdown__menu-item"
        data-test-action={option.id}
        // mouse enter will open the sub menu
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={(e) => {
          // if the mouse leaves this item, close the sub menu only if the mouse did not enter the sub menu itself
          if (!subMenuRef.current || !subMenuRef.current.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        onKeyDown={(e) => {
          // open the sub menu on enter or right arrow
          if (e.keyCode === 39 || e.keyCode === 13) {
            setOpen(true);
            e.stopPropagation();
          }
        }}
      >
        {option.label}
        <AngleRightIcon className="oc-kebab__arrow" />
      </button>
      <Popper
        open={open}
        placement="right-start"
        closeOnEsc
        closeOnOutsideClick
        onRequestClose={(e) => {
          // only close the sub menu if clicking anywhere outside the menu item that owns the sub menu
          if (!e || !nodeRef.current || !nodeRef.current.contains(e.target as Node)) {
            setOpen(false);
          }
        }}
        reference={referenceCb}
      >
        <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
          <div
            ref={subMenuCbRef}
            role="presentation"
            className="pf-c-dropdown pf-m-expanded"
            onMouseLeave={(e) => {
              // only close the sub menu if the mouse does not enter the item
              if (!nodeRef.current || !nodeRef.current.contains(e.relatedTarget as Node)) {
                setOpen(false);
              }
            }}
            onKeyDown={(e) => {
              // close the sub menu on left arrow
              if (e.keyCode === 37) {
                setOpen(false);
                e.stopPropagation();
              }
            }}
          >
            <KebabMenuItems
              options={option.children}
              onClick={onClick}
              className="oc-kebab__popper-items"
              focusItem={option.children[0]}
            />
          </div>
        </FocusTrap>
      </Popper>
    </>
  );
};

export default KebabMenuItems;
