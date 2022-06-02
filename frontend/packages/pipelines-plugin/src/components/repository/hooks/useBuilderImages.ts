import * as React from 'react';
import * as _ from 'lodash';
import {
  normalizeBuilderImages,
  NormalizedBuilderImages,
} from '@console/dev-console/src/utils/imagestream-utils';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/lib-core';
import { isBuilder } from '@console/internal/components/image-stream';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const useBuilderImages = (): [NormalizedBuilderImages, boolean, any] => {
  const resourceSelector = {
    isList: true,
    kind: 'ImageStream',
    namespace: 'openshift',
    prop: 'imageStreams',
  };
  const [imageStreams, loaded, loadedError] = useK8sWatchResource<K8sResourceKind[]>(
    resourceSelector,
  );

  const builderImageStreams = React.useMemo(() => _.filter(imageStreams, isBuilder), [
    imageStreams,
  ]);

  const normalizedBuilderImages = React.useMemo(() => normalizeBuilderImages(builderImageStreams), [
    builderImageStreams,
  ]);

  return [normalizedBuilderImages, loaded, loadedError];
};
