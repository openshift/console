import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextVariants, Text, TextContent } from '@patternfly/react-core';

export const CreateStorageSystemHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="co-create-operand__header">
      <TextContent>
        <Text component={TextVariants.h1} className="co-create-operand__header-text">
          {t('ceph-storage-plugin~Create StorageSystem')}
        </Text>
        <Text component={TextVariants.p} className="help-block">
          {t(
            'ceph-storage-plugin~Create a StorageSystem to represent your OpenShift Data Foundation system and all its required storage and computing resources.',
          )}
        </Text>
      </TextContent>
    </div>
  );
};
