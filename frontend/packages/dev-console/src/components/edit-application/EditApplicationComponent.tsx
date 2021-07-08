import * as React from 'react';
import { WatchK8sResultsObject } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import EditApplication from './EditApplication';

type AppResources = {
  editAppResource: WatchK8sResultsObject<K8sResourceKind>;
  service?: WatchK8sResultsObject<K8sResourceKind>;
  route?: WatchK8sResultsObject<K8sResourceKind>;
  buildConfig?: WatchK8sResultsObject<K8sResourceKind[]>;
  pipeline?: WatchK8sResultsObject<PipelineKind[]>;
  imageStream?: WatchK8sResultsObject<K8sResourceKind[]>;
  imageStreams?: WatchK8sResultsObject<K8sResourceKind[]>;
};

type EditApplicationComponentProps = {
  namespace: string;
  appName: string;
  resources: AppResources;
};

const EditApplicationComponent: React.FunctionComponent<EditApplicationComponentProps> = (
  props,
) => {
  const { appName, resources } = props;
  const appLabel = resources.editAppResource?.data?.metadata?.labels?.['app.kubernetes.io/name'];

  const getAssociatedResource = (resourcesObj: WatchK8sResultsObject<K8sResourceKind[]>) => {
    const associatedRes = resourcesObj.data?.find(
      (ob) => ob.metadata.name === appName || ob.metadata.name === appLabel,
    );
    return {
      ...resourcesObj,
      data: associatedRes,
    };
  };

  return (
    <EditApplication
      {...props}
      resources={{
        ...resources,
        pipeline: getAssociatedResource(resources.pipeline) as WatchK8sResultsObject<PipelineKind>,
        buildConfig: getAssociatedResource(resources.buildConfig),
      }}
    />
  );
};

export default EditApplicationComponent;
