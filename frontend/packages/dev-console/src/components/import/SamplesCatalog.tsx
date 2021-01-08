import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { ImageStreamModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FirehoseResource, LoadingBox, history } from '@console/internal/components/utils';
import { PageLayout } from '@console/shared';
import { normalizeBuilderImages, NormalizedBuilderImages } from '../../utils/imagestream-utils';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import NamespacedPage from '../NamespacedPage';

const imageStreamResource: FirehoseResource = {
  kind: ImageStreamModel.kind,
  prop: 'imageStreams',
  isList: true,
  namespace: 'openshift',
};

type SampleCatalogProps = RouteComponentProps<{ ns?: string }>;

const SampleCatalog: React.FC<SampleCatalogProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const [imageStreams, imageStreamsloaded] = useK8sWatchResource(imageStreamResource);

  const builderImages: NormalizedBuilderImages = React.useMemo(
    () => normalizeBuilderImages(imageStreams),
    [imageStreams],
  );

  if (!imageStreamsloaded) return <LoadingBox />;

  const sampleBuilderImages = _.sortBy(Object.values(builderImages), 'name');

  const galleryItems = sampleBuilderImages.map((builderImage) => {
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
        <title>{t('devconsole~Samples')}</title>
      </Helmet>
      <NamespacedPage hideApplications>
        {namespace ? (
          <PageLayout
            title={t('devconsole~Samples')}
            hint={t('devconsole~Get Started using applications by choosing a code sample.')}
          >
            <Gallery className="co-catalog-tile-view" hasGutter>
              {galleryItems}
            </Gallery>
          </PageLayout>
        ) : (
          <CreateProjectListPage title={t('devconsole~Samples')}>
            {t('devconsole~Select a Project to view the list of samples.')}
          </CreateProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

export default SampleCatalog;
