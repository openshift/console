import * as React from 'react';
import * as _ from 'lodash';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
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
import { ExternalLink } from '@console/internal/components/utils';

const imageStreamText = (
  <>
    <hr />
    <p>The following resources will be created:</p>
    <ul>
      <li>
        A <span className="co-catalog-item-details__kind-label">build config</span> to build source
        from a Git repository.
      </li>
      <li>
        An <span className="co-catalog-item-details__kind-label">image stream</span> to track built
        images.
      </li>
      <li>
        A <span className="co-catalog-item-details__kind-label">deployment config</span> to rollout
        new revisions when the image changes.
      </li>
      <li>
        A <span className="co-catalog-item-details__kind-label">service</span> to expose your
        workload inside the cluster.
      </li>
      <li>
        An optional <span className="co-catalog-item-details__kind-label">route</span> to expose
        your workload outside the cluster.
      </li>
    </ul>
  </>
);

const normalizeBuilderImages = (
  builderImageStreams: K8sResourceKind[],
  activeNamespace: string = '',
): CatalogItem[] => {
  const normalizedBuilderImages = _.map(builderImageStreams, (imageStream) => {
    const { uid, name, namespace, annotations } = imageStream.metadata;
    const tag = getMostRecentBuilderTag(imageStream);
    const displayName = annotations?.[ANNOTATIONS.displayName] ?? name;
    const icon = getImageStreamIcon(tag);
    const imgUrl = getImageForIconClass(icon);
    const iconClass = imgUrl ? null : icon;
    const description = tag?.['annotations']?.['description'] ?? '';
    const tags = getAnnotationTags(tag);
    const createLabel = 'Create Application';
    const provider = annotations?.[ANNOTATIONS.providerDisplayName] ?? '';
    const href = `/catalog/source-to-image?imagestream=${name}&imagestream-ns=${namespace}&preselected-ns=${activeNamespace}`;
    const builderImageTag = _.head(imageStream.spec?.tags);
    const sampleRepo = builderImageTag?.['annotations']?.['sampleRepo'];
    const creationTimestamp = imageStream.metadata?.creationTimestamp;

    const detailsProperties = [
      {
        label: 'Sample Repository',
        value: (
          <ExternalLink href={sampleRepo} additionalClassName="co-break-all" text={sampleRepo} />
        ),
      },
    ];

    const detailsDescriptions = [
      {
        value: imageStreamText,
      },
    ];

    const item: CatalogItem = {
      uid,
      type: 'BuilderImage',
      name: displayName,
      provider,
      description,
      tags,
      creationTimestamp,
      cta: {
        label: createLabel,
        href,
      },
      icon: {
        url: imgUrl,
        class: iconClass,
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

const useBuilderImages: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
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

  const normalizedBuilderImages = React.useMemo(
    () => normalizeBuilderImages(builderImageStreams, namespace),
    [builderImageStreams, namespace],
  );

  return [normalizedBuilderImages, loaded, loadedError];
};

export default useBuilderImages;
