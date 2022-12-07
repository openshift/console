import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { EndpointSliceKind } from '../module/k8s';
import { ConnectedIcon, DisconnectedIcon } from '@patternfly/react-icons';
import { EndPointSliceModel } from '@console/app/src/models';
import { LoadingInline } from '@console/internal/components/utils';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';

export type PodTrafficProp = {
  podName: string;
  namespace: string;
  tooltipFlag?: boolean;
};

export const PodTraffic: React.FC<PodTrafficProp> = ({ podName, namespace, tooltipFlag }) => {
  const { t } = useTranslation();
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
  } else if (loaded && loadError) {
    return <Status status="Error" title={t('public~Error')} />;
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
            content={
              receivingTraffic ? t('public~Receiving Traffic') : t('public~Not Receiving Traffic')
            }
          >
            {receivingTraffic ? <ConnectedIcon /> : <DisconnectedIcon />}
          </Tooltip>
        </div>
      )
    );
  }
  return loaded && !loadError && (receivingTraffic ? <ConnectedIcon /> : <DisconnectedIcon />);
};
