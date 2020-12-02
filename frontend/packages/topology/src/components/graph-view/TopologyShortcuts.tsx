import * as React from 'react';
import { TFunction } from 'i18next';
import { Shortcut, ShortcutTable } from '@console/shared';

export const getTopologyShortcuts = (t: TFunction): React.ReactElement => (
  <ShortcutTable>
    <Shortcut drag>{t('topology~Move')}</Shortcut>
    <Shortcut shift drag>
      {t('topology~Edit application grouping')}
    </Shortcut>
    <Shortcut rightClick>{t('topology~Access context menu')}</Shortcut>
    <Shortcut click>{t('topology~View details in side panel')}</Shortcut>
    <Shortcut hover>{t('topology~Access create connector handle')}</Shortcut>
    <Shortcut ctrl keyName="Spacebar">
      {t('topology~Open quick search modal')}
    </Shortcut>
  </ShortcutTable>
);
