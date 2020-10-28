import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { CatalogItem, CatalogItemDetailsPropertyVariant } from '@console/plugin-sdk';
import {
  getAnnotationTags,
  getMostRecentBuilderTag,
  isBuilder,
} from '@console/internal/components/image-stream';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  getImageForIconClass,
  getImageStreamIcon,
} from '@console/internal/components/catalog/catalog-item-icon';
import { ANNOTATIONS } from '@console/shared';
import { getActiveNamespace } from '@console/internal/reducers/ui';

const normalizeBuilderImages = (
  builderImageStreams: K8sResourceKind[],
  activeNamespace: string = '',
): CatalogItem[] => {
  const normalizedBuilderImages = _.map(builderImageStreams, (imageStream) => {
    const { name, namespace } = imageStream.metadata;
    const tag = getMostRecentBuilderTag(imageStream);
    const tileName =
      _.get(imageStream, ['metadata', 'annotations', ANNOTATIONS.displayName]) || name;
    const iconClass = getImageStreamIcon(tag);
    const tileImgUrl = getImageForIconClass(iconClass);
    const tileIconClass = tileImgUrl ? null : iconClass;
    const tileDescription = _.get(tag, 'annotations.description');
    const tags = getAnnotationTags(tag);
    const createLabel = 'Create Application';
    const tileProvider = _.get(tag, ['annotations', ANNOTATIONS.providerDisplayName]);
    const href = `/catalog/source-to-image?imagestream=${name}&imagestream-ns=${namespace}&preselected-ns=${activeNamespace}`;
    const builderImageTag = _.head(_.get(imageStream, 'spec.tags'));
    const sampleRepo = _.get(builderImageTag, 'annotations.sampleRepo');
    const creationTimestamp = imageStream.metadata?.creationTimestamp;

    const detailsProperties = [
      {
        type: CatalogItemDetailsPropertyVariant.TEXT,
        title: 'Provider',
        value: tileProvider,
      },
      {
        type: CatalogItemDetailsPropertyVariant.EXTERNAL_LINK,
        title: 'Sample Repository',
        value: sampleRepo,
      },
      {
        type: CatalogItemDetailsPropertyVariant.TIMESTAMP,
        title: 'Created At',
        value: creationTimestamp,
      },
    ];

    const detailsDescriptions = [
      {
        type: CatalogItemDetailsPropertyVariant.MARKDOWN,
        title: 'Description',
        value: tileDescription,
      },
    ];

    const item: CatalogItem = {
      type: 'ImageStream',
      name: tileName,
      provider: tileProvider,
      description: tileDescription,
      tags,
      obj: imageStream,
      cta: {
        label: createLabel,
        href,
      },
      icon: {
        url: tileImgUrl,
        class: tileIconClass,
      },
      details: {
        properties: detailsProperties,
        descriptions: detailsDescriptions,
      },
    };

    return item;
  });

  return normalizedBuilderImages;
};

const useBuilderImages = (): [CatalogItem[], boolean, any] => {
  const resourceSelector = {
    isList: true,
    kind: 'ImageStream',
    namespace: 'openshift',
    prop: 'imageStreams',
  };
  const [imageStreams, loaded, loadedError] = useK8sWatchResource<K8sResourceKind[]>(
    resourceSelector,
  );

  const activeNamespace = useSelector(getActiveNamespace);

  const builderImageStreams = _.filter(imageStreams, isBuilder);

  const normalizedBuilderImages = React.useMemo(
    () => normalizeBuilderImages(builderImageStreams, activeNamespace),
    [activeNamespace, builderImageStreams],
  );

  return [normalizedBuilderImages, loaded, loadedError];
};

export default useBuilderImages;
