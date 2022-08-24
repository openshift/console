import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SelectInputOption } from '@console/shared';
import { getBootstrapServers } from '../utils/create-eventsources-utils';
import { kafkaBootStrapServerResourcesWatcher } from '../utils/get-knative-resources';

export const useBootstrapServers = (namespace: string): [SelectInputOption[], React.ReactNode] => {
  const { t } = useTranslation();
  const memoResources = React.useMemo(() => kafkaBootStrapServerResourcesWatcher(namespace), [
    namespace,
  ]);
  const { kafkas, kafkaconnections } = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(memoResources);

  return React.useMemo(() => {
    let bootstrapServersOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    const isKafkasLoaded =
      (kafkas.loaded && !kafkas.loadError) ||
      (kafkaconnections.loaded && !kafkaconnections.loadError);
    const isKafkasLoadError = !!(kafkas.loadError && kafkaconnections.loadError);
    if (isKafkasLoaded) {
      const kafkasData = [
        ...(kafkas.data ? kafkas.data : []),
        ...(kafkaconnections.data ? kafkaconnections.data : []),
      ];
      bootstrapServersOptions = !_.isEmpty(kafkasData)
        ? _.map(getBootstrapServers(kafkasData), (bs) => ({
            value: bs,
            disabled: false,
          }))
        : [
            {
              value: t('knative-plugin~No bootstrap servers found'),
              disabled: true,
            },
          ];
      placeholder = t('knative-plugin~Add bootstrap servers');
    } else if (isKafkasLoadError) {
      placeholder = t(
        'knative-plugin~{{loadErrorMessage}}. Try adding bootstrap servers manually.',
        {
          loadErrorMessage: `${kafkas.loadError.message}, ${kafkaconnections.loadError.message}`,
        },
      );
    } else {
      bootstrapServersOptions = [
        { value: t('knative-plugin~Loading bootstrap servers...'), disabled: true },
      ];
      placeholder = '...';
    }

    return [bootstrapServersOptions, placeholder];
  }, [
    kafkas.loaded,
    kafkas.loadError,
    kafkas.data,
    kafkaconnections.loaded,
    kafkaconnections.loadError,
    kafkaconnections.data,
    t,
  ]);
};
