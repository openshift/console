import * as React from 'react';
import { TFunction } from 'i18next';
import { Shortcut, ShortcutTable } from '@console/shared';

export type Options = {
  supportedFileTypes: string[];
};
export const getTopologyShortcuts = (t: TFunction, options: Options): React.ReactElement => (
  <ShortcutTable>
    <Shortcut drag>{t('topology~Move')}</Shortcut>
    <Shortcut shift drag>
      {t('topology~Edit Application grouping')}
    </Shortcut>
    <Shortcut rightClick>{t('topology~Access context menu')}</Shortcut>
    <Shortcut click>{t('topology~View details in side panel')}</Shortcut>
    <Shortcut hover>{t('topology~Access create connector handle')}</Shortcut>
    <Shortcut ctrl keyName="Spacebar">
      {t('topology~Open quick search modal')}
    </Shortcut>
    {options?.supportedFileTypes?.length > 0 && (
      <Shortcut dragNdrop>
        {t('topology~Upload file ({{fileTypes}}) to project', {
          fileTypes: options.supportedFileTypes.map((ex) => `.${ex}`).toString(),
        })}
      </Shortcut>
    )}
  </ShortcutTable>
);
