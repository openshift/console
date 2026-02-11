import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ImageStreamModel, ProjectModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import DevPreviewBadge from '@console/shared/src/components/badges/DevPreviewBadge';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { QUERY_PROPERTIES } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import QueryFocusApplication from '../QueryFocusApplication';
import { ImportTypes, ImportData } from './import-types';
import ImportForm from './ImportForm';

const ImportFlows = (t: TFunction): { [name: string]: ImportData } => ({
  git: {
    type: ImportTypes.git,
    title: t('devconsole~Import from Git'),
    buildStrategy: 'Devfile',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then(
        (m) => m.GitImportForm,
      ),
  },
  s2i: {
    type: ImportTypes.s2i,
    title: t('devconsole~Create Source-to-Image application'),
    buildStrategy: 'Source',
    loader: () =>
      import('./SourceToImageForm' /* webpackChunkName: "source-to-image-form" */).then(
        (m) => m.SourceToImageForm,
      ),
  },
});

const ImportPage: FunctionComponent = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const imageStreamName = searchParams.get('imagestream');
  const imageStreamNamespace = searchParams.get('imagestream-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const importType = searchParams.get('importType');

  const isS2i = !!(imageStreamName && imageStreamNamespace);
  const importData: ImportData = isS2i ? ImportFlows(t).s2i : ImportFlows(t).git;

  const watchResources = useMemo(
    () => ({
      imageStreams: isS2i
        ? {
            kind: ImageStreamModel.kind,
            isList: false,
            name: imageStreamName,
            namespace: imageStreamNamespace,
          }
        : {
            kind: ImageStreamModel.kind,
            isList: true,
            namespace: 'openshift',
          },
      projects: {
        kind: ProjectModel.kind,
        isList: true,
      },
    }),
    [isS2i, imageStreamName, imageStreamNamespace],
  );

  const resources = useK8sWatchResources<{
    imageStreams: K8sResourceKind | K8sResourceKind[];
    projects: K8sResourceKind[];
  }>(watchResources);

  const imageStreams = {
    data: resources.imageStreams.data,
    loaded: resources.imageStreams.loaded,
    loadError: resources.imageStreams.loadError,
  };

  const projects = {
    data: resources.projects.data,
    loaded: resources.projects.loaded,
    loadError: resources.projects.loadError,
  };

  return (
    <QueryFocusApplication>
      {(application) => (
        <NamespacedPage disabled variant={NamespacedPageVariants.light}>
          <DocumentTitle>{importData.title}</DocumentTitle>
          <PageHeading
            title={importData.title}
            badge={importType === ImportTypes.devfile ? <DevPreviewBadge /> : null}
          />
          <ImportForm
            forApplication={application}
            contextualSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
            namespace={namespace || preselectedNamespace}
            importData={importData}
            imageStreams={imageStreams}
            projects={projects}
          />
        </NamespacedPage>
      )}
    </QueryFocusApplication>
  );
};

export default ImportPage;
