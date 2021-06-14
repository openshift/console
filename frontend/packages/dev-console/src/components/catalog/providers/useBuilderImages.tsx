import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  getImageForIconClass,
  getImageStreamIcon,
} from '@console/internal/components/catalog/catalog-item-icon';
import {
  getAnnotationTags,
  getMostRecentBuilderTag,
  isBuilder,
} from '@console/internal/components/image-stream';
import { ExternalLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared';

const normalizeBuilderImages = (
  builderImageStreams: K8sResourceKind[],
  activeNamespace: string = '',
  t: TFunction,
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
    const createLabel = t('devconsole~Create Application');
    const provider = annotations?.[ANNOTATIONS.providerDisplayName] ?? '';
    const href = `/catalog/source-to-image?imagestream=${name}&imagestream-ns=${namespace}&preselected-ns=${activeNamespace}`;
    const builderImageTag = _.head(imageStream.spec?.tags);
    const sampleRepo = builderImageTag?.['annotations']?.['sampleRepo'];
    const creationTimestamp = imageStream.metadata?.creationTimestamp;

    const detailsProperties = [
      {
        label: t('devconsole~Sample repository'),
        value: (
          <ExternalLink href={sampleRepo} additionalClassName="co-break-all" text={sampleRepo} />
        ),
      },
    ];

    const imageStreamText = (
      <>
        <p>{t('devconsole~The following resources will be created:')}</p>
        <ul>
          <li>
            <Trans ns="devconsole" t={t}>
              A <span className="co-catalog-item-details__kind-label">BuildConfig</span> to build
              source from a Git repository.
            </Trans>
          </li>
          <li>
            <Trans ns="devconsole" t={t}>
              An <span className="co-catalog-item-details__kind-label">ImageStream</span> to track
              built Images.
            </Trans>
          </li>
          <li>
            <Trans ns="devconsole" t={t}>
              A <span className="co-catalog-item-details__kind-label">DeploymentConfig</span> to
              rollout new revisions when the Image changes.
            </Trans>
          </li>
          <li>
            <Trans ns="devconsole" t={t}>
              A <span className="co-catalog-item-details__kind-label">Service</span> to expose your
              workload inside the Cluster.
            </Trans>
          </li>
          <li>
            <Trans ns="devconsole" t={t}>
              An optional <span className="co-catalog-item-details__kind-label">Route</span> to
              expose your workload outside the Cluster.
            </Trans>
          </li>
        </ul>
      </>
    );

    const detailsDescriptions = [
      {
        value: <p>{description}</p>,
      },
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

const useBuilderImages: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
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
    () => normalizeBuilderImages(builderImageStreams, namespace, t),
    [builderImageStreams, namespace, t],
  );

  return [normalizedBuilderImages, loaded, loadedError];
};

export default useBuilderImages;
