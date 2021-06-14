import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  getImageForIconClass,
  getImageStreamIcon,
} from '@console/internal/components/catalog/catalog-item-icon';
import { getMostRecentBuilderTag, isBuilder } from '@console/internal/components/image-stream';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared';
import { prettifyName } from '../../../utils/imagestream-utils';

const normalizeBuilderImages = (
  builderImageStreams: K8sResourceKind[],
  activeNamespace: string,
  t: TFunction,
): CatalogItem[] => {
  const normalizedBuilderImages = _.map(builderImageStreams, (imageStream) => {
    const { uid, name, namespace: imageStreamNS, annotations } = imageStream.metadata;
    const tag = getMostRecentBuilderTag(imageStream);
    const displayName = annotations?.[ANNOTATIONS.displayName] ?? name;
    const title = displayName && displayName.length < 14 ? displayName : prettifyName(name);
    const icon = getImageStreamIcon(tag);
    const imgUrl = getImageForIconClass(icon);
    const iconClass = imgUrl ? null : icon;
    const description = tag?.['annotations']?.['description'] ?? '';
    const provider = annotations?.[ANNOTATIONS.providerDisplayName] ?? '';
    const creationTimestamp = imageStream.metadata?.creationTimestamp;
    const href = `/samples/ns/${activeNamespace}/${name}/${imageStreamNS}`;
    const createLabel = t('devconsole~Create Application');
    const type = 'Sample';

    const item: CatalogItem = {
      uid: `${type}-${uid}`,
      type,
      name: title,
      provider,
      description,
      creationTimestamp,
      icon: {
        url: imgUrl,
        class: iconClass,
      },
      cta: {
        label: createLabel,
        href,
      },
    };
    return item;
  });

  return normalizedBuilderImages;
};

const useBuilderImageSamples: ExtensionHook<CatalogItem[]> = ({ namespace }) => {
  const resourceSelector = {
    isList: true,
    kind: 'ImageStream',
    namespace: 'openshift',
    prop: 'imageStreams',
  };
  const { t } = useTranslation();
  const [imageStreams, loaded, loadedError] = useK8sWatchResource<K8sResourceKind[]>(
    resourceSelector,
  );

  const builderImageStreams = React.useMemo(() => _.filter(imageStreams, isBuilder), [
    imageStreams,
  ]);

  const normalizedBuilderImages = React.useMemo(
    () => normalizeBuilderImages(builderImageStreams, namespace, t),
    [builderImageStreams, namespace, t],
  );

  return [normalizedBuilderImages, loaded, loadedError];
};

export default useBuilderImageSamples;
