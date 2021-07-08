import * as React from 'react';
import { Flex, FlexItem, Divider, Label, Text, TextVariants } from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceToken } from '../../components/access-services/ServicesToken';
import { ServiceAccountCRName, operatorIcon } from '../../const';
import { CloudServiceAccountRequest } from '../../models';
import { isResourceStatusSuccessful } from '../../utils/conditionHandler';
import { RHOASServices } from '../catalog-content';
import { CATALOG_TYPE } from '../const';

const useRhoasCatalog: ExtensionHook<CatalogItem[]> = ({
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
  const isServiceAccountValid = isResourceStatusSuccessful(serviceAccount as K8sResourceKind);
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
        <Flex direction={{ default: 'column' }} className="catalog-tile-pf-body">
          <FlexItem className="catalog-tile-pf-description">
            {t(
              'rhoas-plugin~Red Hat OpenShift Application Services include services like Red Hat OpenShift Streams for Apache Kafka',
            )}
          </FlexItem>
          <FlexItem>{token}</FlexItem>
        </Flex>
      );
    };

    const cloudServicesCardDetailsDescription = [
      {
        label: t('rhoas-plugin~Unlock with API token'),
        value: <ServiceToken namespace={namespace} />,
      },
      {
        value: <Divider component="li" />,
      },
      {
        label: 'Description',
        value: (
          <Text component={TextVariants.p}>
            {t('rhoas-plugin~Cloud Services Card Description')}
          </Text>
        ),
      },
    ];

    if (isServiceAccountValid) {
      const rhoasCard: CatalogItem[] = RHOASServices.map(
        ({
          serviceName,
          name,
          type,
          uid,
          description,
          provider,
          tags,
          icon,
          ctaLabel,
          details,
        }) => {
          return {
            name,
            type,
            uid,
            description,
            provider,
            tags,
            icon: {
              url: icon,
            },
            cta: {
              label: ctaLabel,
              href: `/rhoas/ns/${namespace}/${serviceName}`,
            },
            details: {
              descriptions: [{ value: <SyncMarkdownView content={details} /> }],
            },
          };
        },
      );
      return rhoasCard;
    }

    const cloudServicesCard: CatalogItem[] = [
      {
        name: t('rhoas-plugin~Red Hat OpenShift Application Services'),
        type: CATALOG_TYPE,
        uid: 'services-1615213269575',
        description: tokenStatusFooter(),
        provider: 'Red Hat, Inc.',
        tags: ['kafka', 'cloud', 'service', 'managed', 'rhoas', 'rhosak'],
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
