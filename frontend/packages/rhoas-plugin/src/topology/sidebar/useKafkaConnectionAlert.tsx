import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology/src/types';
import { useTranslation } from 'react-i18next';
import { DetailsResourceAlertContent } from '@console/dynamic-plugin-sdk';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '../components/const';

export const useKafkaConnectionAlert = (element: GraphElement): DetailsResourceAlertContent => {
  const { t } = useTranslation();
  if (element.getType() !== TYPE_MANAGED_KAFKA_CONNECTION) return null;
  return {
    title: t('rhoas-plugin~Cloud Service'),
    dismissible: true,
    content: (
      <>{t('rhoas-plugin~This resource represents service that exist outside your cluster')}</>
    ),
    variant: 'default',
  };
};
