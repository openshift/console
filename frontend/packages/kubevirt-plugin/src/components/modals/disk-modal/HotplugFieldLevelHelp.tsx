import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { FieldLevelHelp } from '@console/internal/components/utils';

export const HotplugFieldLevelHelp = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp popoverHasAutoWidth>
      <Stack hasGutter>
        <StackItem>
          <b>{t('kubevirt-plugin~Hot-plug disk')}</b>
        </StackItem>
        <StackItem>
          {t('kubevirt-plugin~The disk will be immediately added (hot-plugged) to the running VM.')}
        </StackItem>
      </Stack>
    </FieldLevelHelp>
  );
};
