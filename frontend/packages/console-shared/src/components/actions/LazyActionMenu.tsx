import * as React from 'react';
import { Menu, Popper, MenuContent, MenuList } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Action } from '@console/dynamic-plugin-sdk';
import { LazyActionMenuProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { checkAccess } from '@console/internal/components/utils';
import ActionServiceProvider from './ActionServiceProvider';
import ActionMenuContent from './menu/ActionMenuContent';
import ActionMenuToggle from './menu/ActionMenuToggle';
import { ActionMenuVariant } from './types';

type LazyMenuRendererProps = {
  isOpen: boolean;
  actions: Action[];
  containerRef: React.RefObject<HTMLDivElement>;
  menuRef: React.RefObject<HTMLDivElement>;
  toggleRef: React.RefObject<HTMLButtonElement>;
} & React.ComponentProps<typeof ActionMenuContent>;

const LazyMenuRenderer: React.FC<LazyMenuRendererProps> = ({
  isOpen,
  actions,
  containerRef,
  menuRef,
  toggleRef,
  ...restProps
}) => {
  React.useEffect(() => {
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
      <MenuContent data-test-id="action-items" translate="no">
        <MenuList>
          <ActionMenuContent {...restProps} />
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <Popper
      reference={toggleRef}
      popper={menu}
      placement="bottom-end"
      isVisible={isOpen}
      appendTo={containerRef.current}
      popperMatchesTriggerWidth={false}
    />
  );
};

const LazyActionMenu: React.FC<LazyActionMenuProps> = ({
  context,
  variant = ActionMenuVariant.KEBAB,
  label,
  isDisabled,
}) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [initActionLoader, setInitActionLoader] = React.useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const hideMenu = () => {
    setIsOpen(false);
  };

  const handleHover = React.useCallback(() => {
    setInitActionLoader(true);
  }, []);

  return (
    <div ref={containerRef}>
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
                containerRef={containerRef}
                menuRef={menuRef}
                toggleRef={toggleRef}
                onClick={hideMenu}
                focusItem={options[0]}
              />
            )
          }
        </ActionServiceProvider>
      )}
    </div>
  );
};

export default LazyActionMenu;
