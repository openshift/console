import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextVariants,
  Text,
  TextContent,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import './create-storage-system.scss';

export const CreateStorageSystemHeader: React.FC<CreateStorageSystemHeaderProps> = ({ url }) => {
  const { t } = useTranslation();
  return (
    <div className="odf-create-storage-system__header">
      <Breadcrumb className="odf-create-storage-system__breadcrumb">
        <BreadcrumbItem to={url.replace('/~new', '')}>OpenShift Data Foundation</BreadcrumbItem>
        <BreadcrumbItem>{t('ceph-storage-plugin~Create StorageSystem')}</BreadcrumbItem>
      </Breadcrumb>
      <TextContent>
        <Text component={TextVariants.h1}>{t('ceph-storage-plugin~Create StorageSystem')}</Text>
        <Text component={TextVariants.small}>
          {t(
            'ceph-storage-plugin~Create a StorageSystem to represent your OpenShift Data Foundation system and all its required storage and computing resources.',
          )}
        </Text>
      </TextContent>
    </div>
  );
};

type CreateStorageSystemHeaderProps = {
  url: string;
};
