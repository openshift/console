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
import { CatalogExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceToken } from '../../components/access-services/ServicesToken';
import { ServiceAccountCRName, kafkaIcon, operatorIcon } from '../../const';
import { CloudServiceAccountRequest } from '../../models';
import { isResourceStatusSuccessfull } from '../../utils/conditionHandler';
import { CATALOG_TYPE } from '../const';

const useRhoasCatalog: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [serviceAccount, loaded, errorMsg] = useK8sWatchResource({
    kind: referenceForModel(CloudServiceAccountRequest),
    isList: false,
    name: ServiceAccountCRName,
    namespace,
    namespaced: true,
  });

  const loadedOrError = loaded || errorMsg;
  const isServiceAccountValid = isResourceStatusSuccessfull(serviceAccount);
  const services = React.useMemo(() => {
    if (!loaded && !errorMsg) return [];

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

    const serviceKafkaCardDescription = (
      <TextContent>
        <Text component={TextVariants.p}>{t('rhoas-plugin~KafkaCardDescription')}</Text>
      </TextContent>
    );

    const cloudServicesCardDescription = (
      <Flex direction={{ default: 'column' }}>
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.p}>
              {t('rhoas-plugin~ManagedServices-card-description')}
            </Text>
          </TextContent>
        </FlexItem>
        <Divider component="li" />
        <FlexItem>
          <Text component={TextVariants.h2}>
            {t('rhoas-plugin~Access Red Hat Cloud Services with API Token')}
          </Text>
          <ServiceToken namespace={namespace} />
        </FlexItem>
      </Flex>
    );

    const serviceKafkaCardDetailsDescription = [
      {
        value: serviceKafkaCardDescription,
      },
    ];

    const cloudServicesCardDetailsDescription = [
      {
        value: cloudServicesCardDescription,
      },
    ];

    if (isServiceAccountValid) {
      const serviceKafkaCard: CatalogItem[] = [
        {
          name: 'Streams for Apache Kafka',
          type: CATALOG_TYPE,
          uid: 'streams-1615213269575',
          description: 'Streams for Apache Kafka',
          provider: 'Red Hat',
          tags: ['kafka', 'service'],
          icon: {
            url: kafkaIcon,
          },
          cta: {
            label: 'Connect',
            href: `/rhoas/ns/${namespace}/kafka`,
          },
          details: {
            properties: [{ label: 'Type', value: 'Red Hat Cloud Service' }],
            descriptions: serviceKafkaCardDetailsDescription,
          },
        },
      ];
      return serviceKafkaCard;
    }

    const cloudServicesCard: CatalogItem[] = [
      {
        name: 'Red Hat Cloud Services',
        type: CATALOG_TYPE,
        uid: 'services-1615213269575',
        description: tokenStatusFooter(),
        provider: 'Red Hat',
        tags: ['kafka', 'service'],
        icon: {
          url: operatorIcon,
        },
        details: {
          properties: [{ label: 'Type', value: 'Red Hat Cloud Service' }],
          descriptions: cloudServicesCardDetailsDescription,
        },
      },
    ];
    return cloudServicesCard;
  }, [namespace, errorMsg, isServiceAccountValid, loaded, serviceAccount, t]);

  return [services, loadedOrError, undefined];
};

export default useRhoasCatalog;
