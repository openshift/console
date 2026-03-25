import type { RefObject, ComponentProps, FC } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Menu, Popper, MenuContent, MenuList } from '@patternfly/react-core';
import * as _ from 'lodash';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { LazyActionMenuProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { checkAccess } from '@console/internal/components/utils/rbac';
import ActionServiceProvider from './ActionServiceProvider';
import ActionMenuContent from './menu/ActionMenuContent';
import ActionMenuToggle from './menu/ActionMenuToggle';
import { ActionMenuVariant } from './types';

type LazyMenuRendererProps = {
  isOpen: boolean;
  actions: Action[];
  menuRef: RefObject<HTMLDivElement>;
  toggleRef: RefObject<HTMLButtonElement>;
} & ComponentProps<typeof ActionMenuContent>;

export const KEBAB_COLUMN_CLASS = 'pf-v6-c-table__action';

const LazyMenuRenderer: FC<LazyMenuRendererProps> = ({
  isOpen,
  actions,
  menuRef,
  toggleRef,
  ...restProps
}) => {
  useEffect(() => {
    // Check access after loading actions from service over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(actions, (action: Action) => {
      if (action.accessReview) {
        checkAccess(action.accessReview).catch((e) =>
          // eslint-disable-next-line no-console
          console.warn('Could not check access for action menu', e),
        );
      }
    });
  }, [actions]);

  const menu = (
    <Menu ref={menuRef} containsFlyout onSelect={restProps.onClick}>
      <MenuContent data-test-id="action-items">
        <MenuList>
          <ActionMenuContent {...restProps} />
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return <Popper triggerRef={toggleRef} popper={menu} placement="bottom-end" isVisible={isOpen} />;
};

const LazyActionMenu: FC<LazyActionMenuProps> = ({
  context,
  variant = ActionMenuVariant.KEBAB,
  label,
  isDisabled,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [initActionLoader, setInitActionLoader] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const hideMenu = () => {
    setIsOpen(false);
  };

  const handleHover = useCallback(() => {
    setInitActionLoader(true);
  }, []);

  return (
    <>
      <ActionMenuToggle
        isOpen={isOpen}
        isDisabled={isDisabled}
        toggleRef={toggleRef}
        toggleVariant={variant}
        toggleTitle={label}
        menuRef={menuRef}
        onToggleClick={setIsOpen}
        onToggleHover={handleHover}
      />
      {initActionLoader && (
        <ActionServiceProvider context={context}>
          {({ actions, options, loaded }) =>
            loaded && (
              <LazyMenuRenderer
                isOpen={isOpen}
                actions={actions}
                options={options}
                menuRef={menuRef}
                toggleRef={toggleRef}
                onClick={hideMenu}
                focusItem={options[0]}
              />
            )
          }
        </ActionServiceProvider>
      )}
    </>
  );
};

export default LazyActionMenu;
