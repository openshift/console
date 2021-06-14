import * as React from 'react';
import { FocusTrap, Menu, MenuList, MenuItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { WithScrollContainer } from '@console/internal/components/utils';
import Popper from '@console/shared/src/components/popper/Popper';
import useAutoComplete from './useAutoComplete';

type AutoCompletePopoverProps = {
  autoCompleteValues: string[];
  children: (contentRefCallback: (ref: HTMLElement) => void) => React.ReactNode;
  onAutoComplete: (newValue: string) => void;
};

const AutoCompletePopover: React.FC<AutoCompletePopoverProps> = ({
  autoCompleteValues,
  children,
  onAutoComplete,
}) => {
  const { t } = useTranslation();

  const {
    contentRefCallback,
    focusTrapProps,
    insertAutoComplete,
    popperProps,
    menuWidth,
    options,
  } = useAutoComplete(autoCompleteValues, onAutoComplete);

  return (
    <>
      {children(contentRefCallback)}
      <WithScrollContainer>
        {(scrollContainer) => (
          <Popper
            {...popperProps}
            placement="bottom-start"
            closeOnEsc
            closeOnOutsideClick
            container={scrollContainer}
            popperOptions={{
              modifiers: {
                hide: {
                  enabled: false,
                },
                preventOverflow: {
                  enabled: false,
                },
                flip: {
                  enabled: false,
                },
              },
            }}
          >
            <FocusTrap {...focusTrapProps}>
              <Menu
                style={{ maxHeight: 200, overflow: 'auto', width: menuWidth }}
                onSelect={(event, itemId: number) => {
                  const text = options[itemId];
                  if (text) {
                    insertAutoComplete(text);
                  }
                }}
              >
                <MenuList translate="no">
                  {options.length === 0 ? (
                    // There is a tab-index problem with the Menus from PF. If the first option is removed, it breaks tab indexes
                    // Need key 0 because of PF bug
                    <MenuItem key={0} itemId={-1} translate="no" isDisabled>
                      {t('pipelines-plugin~No options matching your criteria')}
                    </MenuItem>
                  ) : (
                    options.map((value, idx) => (
                      // Using index-based keys to get around PF bug, see above
                      // eslint-disable-next-line react/no-array-index-key
                      <MenuItem key={idx} itemId={idx} translate="no">
                        {value}
                      </MenuItem>
                    ))
                  )}
                </MenuList>
              </Menu>
            </FocusTrap>
          </Popper>
        )}
      </WithScrollContainer>
    </>
  );
};

export default AutoCompletePopover;
