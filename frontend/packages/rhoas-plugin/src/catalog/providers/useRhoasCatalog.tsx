import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { CATALOG_TYPE } from '../rhoas-catalog-plugin';
import * as React from 'react';
import { Flex, FlexItem, Divider, Label, TextContent, Text, TextVariants} from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons';
import { AccessTokenSecretName, managedKafkaIcon, operatorIcon } from '../../const';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { useActiveNamespace } from '@console/shared';
import { AccessManagedServices } from '../../components/access-managed-services/AccessManagedServices';

const useRhoasCatalog: CatalogExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, any] => {
  const [currentNamespace] = useActiveNamespace();
  const href = '/managedServices/managedkafka'; // `/catalog/ns/${namespace}/rhoas/kafka`;
  const { t } = useTranslation();
  const [tokenSecret] = useK8sWatchResource({ kind: SecretModel.kind, isList: false, name: AccessTokenSecretName, namespace: currentNamespace, namespaced: true })

  const tokenStatusFooter = () => {
    let token;
    if (tokenSecret === null || tokenSecret !== null && Object.keys(tokenSecret).length === 0) {
      token = (
        <Label variant="outline" color="orange" icon={<LockIcon />}>
          {t('rhoas-plugin~Unlock with token')}
        </Label>
      )
    }
    else {
      token = t('rhoas-plugin~Unlocked')
    }
    return (
      <Flex direction={{ default: 'column' }}>
        <FlexItem>
          RHOAS can include Managed Kafka, Service Registry, custom resources for Managed Kafka, and Open Data Hub.
        </FlexItem>
        <FlexItem>
          {token}
        </FlexItem>
      </Flex>
    )
  }

  const drawerDescription = (
    <Flex direction={{ default: 'column' }}>
      <FlexItem>
        <TextContent>
          <Text component={TextVariants.p}>
            Installed cluster-side, creates resources in specific namespaces. The RHOAS operator could include these services below:
          </Text>
          <Text component={TextVariants.p}>
            <b>Kafka Connect:</b> We will add a descsription for Kafka Connect here.
          </Text>
          <Text component={TextVariants.p}>
            <b>API Management:</b> We will add a description for API Management here.
          </Text>
          <Text component={TextVariants.p}>
            <b>Red Hat Open Data Hub:</b> We will add a description for Red Hat Open Data Hub here.
          </Text>
        </TextContent>
      </FlexItem>
      <Divider component="li"/>
      <FlexItem>
        <AccessManagedServices/>
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
      name: 'Red Hat OpenShift Application Services',
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
        descriptions: detailsDescriptions
      },
    },
  ];

  const managedKafkaCard: CatalogItem[] = [
    {
      name: 'Red Hat OpenShift Streams for Apache Kafka',
      type: CATALOG_TYPE,
      uid: new Date().getTime().toString(),
      description: 'OpenShift Streams for Apache Kafka',
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
            value: <p>Here is where we provide the description for Red Hat OpenShift Streams for Apache Kafka</p>,
          }
        ]
      },
    },
  ];

  const services = React.useMemo(() => (tokenSecret ? managedKafkaCard : managedServicesCard), [tokenSecret]);
  return [services, true, undefined];
};

export default useRhoasCatalog;
