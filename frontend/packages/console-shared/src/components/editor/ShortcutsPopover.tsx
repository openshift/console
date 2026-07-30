import { useMemo } from 'react';
import { ShortcutGrid } from '@patternfly/react-component-groups';
import type { PopoverProps } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const isMac = window.navigator.platform.includes('Mac');

export const useShortcutPopover = (shortcutsPopoverProps?: Partial<PopoverProps>): PopoverProps => {
  const { t } = useTranslation('console-shared');

  return useMemo((): PopoverProps => {
    return {
      'aria-label': t('Shortcuts'),
      bodyContent: (
        <ShortcutGrid
          shortcuts={[
            { keys: ['F1'], description: t('View all editor shortcuts') },
            { keys: ['ctrl', 'space'], description: t('Activate auto complete') },
            {
              keys: isMac ? ['ctrl', 'shift', 'm'] : ['ctrl', 'm'],
              description: t(
                'Toggle Tab action between insert Tab character and move focus out of editor',
              ),
            },
            {
              keys: isMac ? ['cmd', 'shift', 'o'] : ['ctrl', 'shift', 'o'],
              description: t('View document outline'),
            },
            { keys: [], hover: true, description: t('View property descriptions') },
            {
              keys: isMac ? ['cmd', 's'] : ['ctrl', 's'],
              description: t('Save'),
            },
          ]}
        />
      ),
      maxWidth: '35rem',
      distance: 18,
      ...shortcutsPopoverProps,
    };
  }, [t, shortcutsPopoverProps]);
};
