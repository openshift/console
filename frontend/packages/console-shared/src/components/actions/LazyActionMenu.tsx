import * as React from 'react';
import { MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { checkAccess } from '@console/internal/components/utils';
import ActionServiceProvider from './ActionServiceProvider';
import ActionMenuRenderer from './menu/ActionMenuRenderer';
import { ActionContext, ActionMenuVariant } from './types';

type LazyActionMenuProps = {
  context: ActionContext;
  variant?: ActionMenuVariant;
  label?: string;
  isDisabled?: boolean;
};

type LazyRendererProps = {
  actions: Action[];
} & React.ComponentProps<typeof ActionMenuRenderer>;

const LazyRenderer: React.FC<LazyRendererProps> = ({ actions, ...restProps }) => {
  React.useEffect(() => {
    // Check access after loading actions from service over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(actions, (action: Action) => {
      if (action.accessReview) {
        checkAccess(action.accessReview);
      }
    });
  }, [actions]);

  return <ActionMenuRenderer {...restProps} />;
};

const LazyActionMenu: React.FC<LazyActionMenuProps> = ({
  context,
  variant = ActionMenuVariant.KEBAB,
  label,
  isDisabled,
}) => {
  const { t } = useTranslation();
  const isKebabVariant = variant === ActionMenuVariant.KEBAB;
  const [active, setActive] = React.useState<boolean>(false);
  const [initActionLoader, setInitActionLoader] = React.useState<boolean>(false);
  const toggleRef = React.useRef<HTMLButtonElement>();
  const toggleRefCb = React.useCallback(() => toggleRef.current, []);
  const toggleLabel = label || t('console-shared~Actions');

  const toggleMenu = () => setActive((value) => !value);

  const hideMenu = () => {
    toggleRef.current?.focus();
    setActive(false);
  };

  const handleRequestClose = (e?: MouseEvent) => {
    if (!e || !toggleRef.current?.contains(e.target as Node)) {
      hideMenu();
    }
  };

  const handleHover = React.useCallback(() => {
    setInitActionLoader(true);
  }, []);

  return (
    <div>
      <MenuToggle
        variant={variant}
        innerRef={toggleRef}
        isExpanded={active}
        isDisabled={isDisabled}
        aria-expanded={active}
        aria-label={toggleLabel}
        aria-haspopup="true"
        data-test-id={isKebabVariant ? 'kebab-button' : 'actions-menu-button'}
        onClick={toggleMenu}
        {...(isKebabVariant ? { onFocus: handleHover, onMouseEnter: handleHover } : {})}
      >
        {isKebabVariant ? <EllipsisVIcon /> : toggleLabel}
      </MenuToggle>
      {initActionLoader && (
        <ActionServiceProvider context={context}>
          {({ actions, options, loaded }) =>
            loaded && (
              <LazyRenderer
                actions={actions}
                open={!isDisabled && active}
                options={options}
                toggleRef={toggleRefCb}
                onClick={hideMenu}
                onRequestClose={handleRequestClose}
              />
            )
          }
        </ActionServiceProvider>
      )}
    </div>
  );
};

export default LazyActionMenu;
