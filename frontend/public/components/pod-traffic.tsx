import type { FC } from 'react';
import { Tooltip } from '@patternfly/react-core';
import { RhUiConnectedIcon, RhUiDisconnectedIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { EndPointSliceModel } from '@console/app/src/models';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import type { EndpointSliceKind } from '../module/k8s';

export type PodTrafficProp = {
  podName: string;
  namespace: string;
  tooltipFlag?: boolean;
};

export const PodTraffic: FC<PodTrafficProp> = ({ podName, namespace, tooltipFlag }) => {
  const { t } = useTranslation('public');
  const [data, loaded, loadError] = useK8sWatchResource<EndpointSliceKind[]>({
    groupVersionKind: {
      kind: EndPointSliceModel.kind,
      version: EndPointSliceModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });

  if (!loaded) {
    return <LoadingInline />;
  }
  if (loaded && loadError) {
    return <Status status="Error" title={t('Error')} />;
  }
  const allEndpoints = data?.reduce((prev, next) => prev.concat(next?.endpoints), []);
  const receivingTraffic = allEndpoints?.some((endPoint) => endPoint?.targetRef?.name === podName);
  if (tooltipFlag) {
    return (
      loaded &&
      !loadError && (
        <div data-test="pod-traffic-status">
          <Tooltip
            position="top"
            content={receivingTraffic ? t('Receiving traffic') : t('Not receiving traffic')}
          >
            {receivingTraffic ? <RhUiConnectedIcon /> : <RhUiDisconnectedIcon />}
          </Tooltip>
        </div>
      )
    );
  }
  return (
    loaded && !loadError && (receivingTraffic ? <RhUiConnectedIcon /> : <RhUiDisconnectedIcon />)
  );
};
