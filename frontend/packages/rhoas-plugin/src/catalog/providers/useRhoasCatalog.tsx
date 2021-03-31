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
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
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
  const isServiceAccountValid = isResourceStatusSuccessfull(serviceAccount as K8sResourceKind);
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

    const serviceKafkaCardDetailsDescription = [
      {
        value: serviceKafkaCardDescription,
      },
    ];

    const cloudServicesCardDetailsDescription = [
      {
        label: t('rhoas-plugin~Access Red Hat Cloud Services with API Token'),
        value: <ServiceToken namespace={namespace} />,
      },
      {
        value: <Divider component="li" />,
      },
      {
        label: 'Description',
        value: t('rhoas-plugin~ManagedServices-card-description'),
      },
    ];

    if (isServiceAccountValid) {
      const serviceKafkaCard: CatalogItem[] = [
        {
          name: t('rhoas-plugin~KafkaStreamsService'),
          type: CATALOG_TYPE,
          uid: 'streams-1615213269575',
          description: t('rhoas-plugin~KafkaStreamsServiceDescription'),
          provider: 'Red Hat',
          tags: ['kafka'],
          icon: {
            url: kafkaIcon,
          },
          cta: {
            label: t('rhoas-plugin~Connect'),
            href: `/rhoas/ns/${namespace}/kafka`,
          },
          details: {
            descriptions: serviceKafkaCardDetailsDescription,
          },
        },
      ];
      return serviceKafkaCard;
    }

    const cloudServicesCard: CatalogItem[] = [
      {
        name: t('rhoas-plugin~Red Hat Cloud Services'),
        type: CATALOG_TYPE,
        uid: 'services-1615213269575',
        description: tokenStatusFooter(),
        provider: 'Red Hat',
        tags: ['kafka'],
        icon: {
          url: operatorIcon,
        },
        details: {
          descriptions: cloudServicesCardDetailsDescription,
        },
      },
    ];
    return cloudServicesCard;
  }, [loaded, errorMsg, t, namespace, isServiceAccountValid, serviceAccount]);

  return [services, loadedOrError, undefined];
};

export default useRhoasCatalog;
