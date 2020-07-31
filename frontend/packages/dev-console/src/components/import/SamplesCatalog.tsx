import * as React from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { ImageStreamModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FirehoseResource, LoadingBox, history } from '@console/internal/components/utils';
import { PageLayout } from '@console/shared';
import { normalizeBuilderImages, NormalizedBuilderImages } from '../../utils/imagestream-utils';
import ProjectListPage from '../projects/ProjectListPage';
import NamespacedPage from '../NamespacedPage';

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
    const url = `/samples/ns/${namespace}/${name}/${imageStreamNamespace}`;
    const handleClick = (e: React.SyntheticEvent) => {
      history.push(url);
      e.preventDefault();
    };
    return (
      <GalleryItem key={name}>
        <CatalogTile
          className="co-catalog-tile"
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
          <PageLayout
            title="Samples"
            hint="Get Started using applications by choosing a code sample."
          >
            <Gallery className="co-catalog-tile-view" hasGutter>
              {galleryItems}
            </Gallery>
          </PageLayout>
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
