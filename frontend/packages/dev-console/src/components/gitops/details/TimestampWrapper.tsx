import * as React from 'react';
import * as _ from 'lodash';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { Timestamp } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  referenceForGroupVersionKind,
  modelFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { GitOpsResource } from '../utils/gitops-types';

interface TimestampWrapperProps {
  resModels: GitOpsResource[];
}

const TimestampWrapper: React.FC<TimestampWrapperProps> = ({ resModels }) => {
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = React.useState<number>(null);
  const memoResources = React.useMemo(() => {
    let resources = {};
    _.forEach(resModels, (res) => {
      const { group, version, kind, name, namespace } = res;
      const resourceRef = referenceForGroupVersionKind(group)(version)(kind);
      const model = modelFor(resourceRef);
      resources = {
        ...resources,
        [`${name}-${kind}-${namespace}`]: {
          ...(model.namespaced ? { namespace } : {}),
          kind: model.crd ? referenceForModel(model) : model.kind,
          namespace,
          name,
          optional: true,
        },
      };
    });
    return resources;
  }, [resModels]);

  const resourcesData = useK8sWatchResources<{
    [key: string]: K8sResourceKind;
  }>(memoResources);

  React.useEffect(() => {
    const timestamp = _.max(
      _.map(resourcesData, (resObj) => {
        const resTimestamp = resObj?.data?.status?.conditions?.[0]?.lastUpdateTime;
        return new Date(resTimestamp).getTime();
      }),
    );
    setLastUpdatedTimestamp(timestamp);
  }, [resourcesData]);

  return (
    <>
      {lastUpdatedTimestamp ? (
        <Timestamp timestamp={lastUpdatedTimestamp} />
      ) : (
        <div>Info not available</div>
      )}
    </>
  );
};

export default TimestampWrapper;
