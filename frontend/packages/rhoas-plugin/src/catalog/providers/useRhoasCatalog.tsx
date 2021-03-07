import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Flex,
  FlexItem,
  Divider,
  Label,
  TextContent,
  Text,
  TextVariants,
  AlertVariant,
} from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useActiveNamespace, useToast } from '@console/shared';
import { AccessManagedServices } from '../../components/access-managed-services/AccessManagedServices';
import { CATALOG_TYPE } from '../rhoas-catalog-plugin';
import { ManagedServiceAccountCRName, AccessTokenSecretName, managedKafkaIcon, operatorIcon } from '../../const';
import { ManagedServiceAccountRequest } from '../../models';
import { getFinishedCondition } from '../../utils/conditionHandler';
import { referenceForModel } from '@console/internal/module/k8s';

const useRhoasCatalog: CatalogExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  const [currentNamespace] = useActiveNamespace();
  const [toastId, setToastEnabled] = React.useState("")
  const href = '/managedServices/managedkafka'; // `/catalog/ns/${namespace}/rhoas/kafka`;
  const { t } = useTranslation();
  const [serviceAccount] = useK8sWatchResource({
    kind: referenceForModel(ManagedServiceAccountRequest),
    isList: false,
    name: ManagedServiceAccountCRName,
    namespace: currentNamespace,
    namespaced: true,
  });

  const condition = getFinishedCondition(serviceAccount)
  console.log("condition", serviceAccount, condition)
  const isServiceAccountValid = condition && condition.status === "True";
  const toast = useToast();
  if (!isServiceAccountValid) {
    if (!toastId) {
      const toastID = toast.addToast({
        title: "Invalid service account",
        content: `You need to regenerate your Service Account and ${AccessTokenSecretName} secret`,
        variant: AlertVariant.warning,
      });

      setToastEnabled(toastID);
    }
  } else {
    toast.removeToast(toastId)
  }

  const tokenStatusFooter = () => {
    let token;
    if (serviceAccount === null || !isServiceAccountValid) {
      token = (
        <Label variant="outline" color="orange" icon={<LockIcon />}>
          {t('rhoas-plugin~Unlock with token')}
        </Label>
      );
    } else {
      token = t('rhoas-plugin~Unlocked');
    }
    return (
      <Flex direction={{ default: 'column' }}>
        <FlexItem>
          {t(
            'rhoas-plugin~RHOAS can include Streams for Kafka, Service Registry',
          )}
        </FlexItem>
        <FlexItem>{token}</FlexItem>
      </Flex>
    );
  };

  const drawerDescription = (
    <Flex direction={{ default: 'column' }}>
      <FlexItem>
        <TextContent>
          <Text component={TextVariants.p}>TO DO: Add description</Text>
        </TextContent>
      </FlexItem>
      <Divider component="li" />
      <FlexItem>
        <AccessManagedServices />
      </FlexItem>
    </Flex>
  );

  const detailsDescriptions = [
    {
      value: drawerDescription,
    },
  ];

  const managedServicesCard: CatalogItem[] = [
    {
      name: 'Red Hat Application Services',
      type: CATALOG_TYPE,
      uid: new Date().getTime().toString(),
      description: tokenStatusFooter(),
      provider: 'Red Hat',
      tags: ['Kafka', 'service', 'managed'],
      creationTimestamp: '2019-09-04T13:56:06Z',
      documentationUrl: 'Refer Documentation',
      attributes: {
        version: '1',
      },
      icon: {
        class: 'ManagedServicesIcon',
        url: operatorIcon,
      },
      cta: {
        label: undefined,
        href: '',
      },
      details: {
        properties: [{ label: 'Type', value: 'Red Hat Managed Service' }],
        descriptions: detailsDescriptions,
      },
    },
  ];

  const managedKafkaCard: CatalogItem[] = [
    {
      name: 'Streams for Apache Kafka',
      type: CATALOG_TYPE,
      uid: new Date().getTime().toString(),
      description: 'Streams for Apache Kafka',
      provider: 'Red Hat',
      tags: ['Kafka', 'service', 'managed'],
      creationTimestamp: '2019-09-04T13:56:06Z',
      documentationUrl: 'Refer Documentation',
      attributes: {
        version: '1',
      },
      icon: {
        class: 'kafkaIcon',
        url: managedKafkaIcon,
      },
      cta: {
        label: 'Connect',
        href,
      },
      details: {
        properties: [{ label: 'Type', value: 'Red Hat Managed Service' }],
        descriptions: [
          {
            value: <p>TO DO: Add description</p>,
          },
        ],
      },
    },
  ];

  const services = React.useMemo(() => (isServiceAccountValid ? managedKafkaCard : managedServicesCard), [
    serviceAccount,
  ]);
  return [services, true, undefined];
};

export default useRhoasCatalog;
