import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { WatchK8sResults, WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ImageStreamModel, ProjectModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { IMAGESTREAM_NAMESPACE, JAVA_IMAGESTREAM_NAME, QUERY_PROPERTIES } from '../../../const';
import { normalizeBuilderImages, NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import QueryFocusApplication from '../../QueryFocusApplication';
import UploadJar from './UploadJar';

type UploadJarPageProps = RouteComponentProps<{ ns?: string }>;

type watchResource = {
  [key: string]: K8sResourceKind[] | K8sResourceKind;
};

const UploadJarPage: React.FunctionComponent<UploadJarPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const params = new URLSearchParams(location.search);

  const resources: WatchK8sResults<watchResource> = useK8sWatchResources<watchResource>({
    projects: {
      kind: ProjectModel.kind,
      isList: true,
    },
    imagestream: {
      kind: ImageStreamModel.kind,
      name: JAVA_IMAGESTREAM_NAME,
      namespace: IMAGESTREAM_NAMESPACE,
    },
  });

  const isResourceLoaded =
    Object.keys(resources).length > 0 &&
    Object.values(resources).every((value) => value.loaded || !!value.loadError);

  if (!isResourceLoaded) return <LoadingBox />;

  let normalizedJavaImages: NormalizedBuilderImages;
  const { loaded: isLoaded, data: isData, loadError: isLoadError } = resources.imagestream;
  if (isLoaded && !isLoadError) {
    normalizedJavaImages = normalizeBuilderImages(isData);
  }

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Upload JAR file')}</title>
      </Helmet>
      <PageHeading title={t('devconsole~Upload JAR file')}>
        {t('devconsole~Upload a JAR file from your local desktop to OpenShift')}
      </PageHeading>
      <QueryFocusApplication>
        {(desiredApplication) => (
          <UploadJar
            forApplication={desiredApplication}
            namespace={namespace}
            projects={resources.projects as WatchK8sResultsObject<K8sResourceKind[]>}
            builderImage={normalizedJavaImages?.[JAVA_IMAGESTREAM_NAME]}
            contextualSource={params.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
          />
        )}
      </QueryFocusApplication>
    </NamespacedPage>
  );
};

export default UploadJarPage;
