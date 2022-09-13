import * as React from 'react';
import { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import { INSTANCE_LABEL, NAME_LABEL } from '../../const';
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
  const appLabel =
    resources.editAppResource?.data?.metadata?.labels?.[NAME_LABEL] ||
    resources.editAppResource?.data?.metadata?.labels?.[INSTANCE_LABEL];

  const filterAssociatedResource = (obj: K8sResourceKind) => {
    return (
      obj.metadata.name === appName ||
      obj.metadata.name === appLabel ||
      (appLabel && obj.metadata.labels?.[NAME_LABEL] === appLabel) ||
      (appLabel && obj.metadata.labels?.[INSTANCE_LABEL] === appLabel)
    );
  };

  const getAssociatedResource = (resourcesObj: WatchK8sResultsObject<K8sResourceKind[]>) => {
    const associatedRes = resourcesObj.data?.find(filterAssociatedResource);
    return {
      ...resourcesObj,
      data: associatedRes,
    };
  };

  const getAssociatedImageStream = (resourcesObj: WatchK8sResultsObject<K8sResourceKind[]>) => {
    const associatedRes = resourcesObj.data?.filter(filterAssociatedResource);
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
        imageStream: getAssociatedImageStream(resources.imageStream),
      }}
    />
  );
};

export default EditApplicationComponent;
