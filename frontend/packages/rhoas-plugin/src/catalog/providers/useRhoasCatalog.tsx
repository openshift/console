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
} from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useActiveNamespace } from '@console/shared';
import { ServiceToken } from '../../components/access-services/ServicesToken';
import { CATALOG_TYPE } from '../rhoas-catalog-plugin';
import { ServiceAccountCRName, kafkaIcon, operatorIcon } from '../../const';
import { ManagedServiceAccountRequest } from '../../models';
import { isSuccessfull } from '../../utils/conditionHandler';
import { referenceForModel } from '@console/internal/module/k8s';

const useRhoasCatalog: CatalogExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  const [currentNamespace] = useActiveNamespace();
  const href = '/managedServices/managedkafka'; // `/catalog/ns/${namespace}/rhoas/kafka`;
  const { t } = useTranslation();
  const [serviceAccount] = useK8sWatchResource({
    kind: referenceForModel(ManagedServiceAccountRequest),
    isList: false,
    name: ServiceAccountCRName,
    namespace: currentNamespace,
    namespaced: true,
  });

  const isServiceAccountValid = isSuccessfull(serviceAccount);

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
          {t('rhoas-plugin~RHOAS can include Streams for Kafka, Service Registry')}
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
        <ServiceToken />
      </FlexItem>
    </Flex>
  );

  const detailsDescriptions = [
    {
      value: drawerDescription,
    },
  ];

  const managedServicesCard: CatalogItem[] = [
    // TODO internationalize this
    {
      name: 'Red Hat Cloud Services',
      type: CATALOG_TYPE,
      uid: 'services-1615213269575',
      description: tokenStatusFooter(),
      provider: 'Red Hat',
      tags: ['kafka', 'service'],
      creationTimestamp: '2019-09-04T13:56:06Z',
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

  const serviceKafkaCard: CatalogItem[] = [
    {
      name: 'Streams for Apache Kafka',
      type: CATALOG_TYPE,
      uid: 'streams-1615213269575',
      description: 'Streams for Apache Kafka',
      provider: 'Red Hat',
      tags: ['Kafka', 'service', 'managed'],
      creationTimestamp: '2019-09-04T13:56:06Z',
      attributes: {
        version: '1',
      },
      icon: {
        class: 'kafkaIcon',
        url: kafkaIcon,
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

  const services = React.useMemo(
    () => (isServiceAccountValid ? serviceKafkaCard : managedServicesCard),
    // Prevent automatically filling the dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return [services, true, undefined];
};

export default useRhoasCatalog;
