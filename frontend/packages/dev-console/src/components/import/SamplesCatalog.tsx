import * as React from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { ImageStreamModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  FirehoseResource,
  PageHeading,
  LoadingBox,
  history,
} from '@console/internal/components/utils';
import { normalizeBuilderImages, NormalizedBuilderImages } from '../../utils/imagestream-utils';
import ProjectListPage from '../projects/ProjectListPage';
import NamespacedPage from '../NamespacedPage';

import '../EmptyState.scss';

const imageStreamResource: FirehoseResource = {
  kind: ImageStreamModel.kind,
  prop: 'imageStreams',
  isList: true,
  namespace: 'openshift',
};

type SampleCatalogProps = RouteComponentProps<{ ns?: string }>;

const SampleCatalog: React.FC<SampleCatalogProps> = ({ match }) => {
  const namespace = match.params.ns;
  const [imageStreams, imageStreamsloaded] = useK8sWatchResource(imageStreamResource);

  const builderImages: NormalizedBuilderImages = React.useMemo(
    () => normalizeBuilderImages(imageStreams),
    [imageStreams],
  );

  if (!imageStreamsloaded) return <LoadingBox />;

  const galleryItems = Object.values(builderImages).map((builderImage) => {
    const { name, title, description, iconUrl, imageStreamNamespace } = builderImage;
    const url = `/samples/ns/${namespace}/is/${name}/isNs/${imageStreamNamespace}`;
    const handleClick = (e: React.SyntheticEvent) => {
      history.push(url);
      e.preventDefault();
    };
    return (
      <GalleryItem key={name}>
        <CatalogTile
          className="odc-empty-state__tile"
          onClick={handleClick}
          href={url}
          title={title}
          iconImg={iconUrl}
          description={description}
        />
      </GalleryItem>
    );
  });

  return (
    <>
      <Helmet>
        <title>Samples</title>
      </Helmet>
      <NamespacedPage hideApplications>
        {namespace ? (
          <>
            <div className="odc-empty-state__title">
              <PageHeading title="Samples" />
              <div className="co-catalog-page__description odc-empty-state__hint-block">
                Get Started using applications by choosing a code sample.
              </div>
            </div>
            <div className="odc-empty-state__content">
              <Gallery className="co-catalog-tile-view" hasGutter>
                {galleryItems}
              </Gallery>
            </div>
          </>
        ) : (
          <ProjectListPage title="Samples">
            Select a project to view the list of Samples.
          </ProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

export default SampleCatalog;
