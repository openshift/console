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
          <b>{t('kubevirt-plugin~Hot-plugged disk')}</b>
        </StackItem>
        <StackItem>
          {t(
            'kubevirt-plugin~This disk will be added immediately (hotplugged) to your running virtual machine.',
          )}
        </StackItem>
      </Stack>
    </FieldLevelHelp>
  );
};
