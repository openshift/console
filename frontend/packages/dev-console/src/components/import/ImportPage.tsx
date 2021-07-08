import * as React from 'react';
import { TFunction } from 'i18next';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { PageHeading, Firehose, FirehoseResource } from '@console/internal/components/utils';
import { ImageStreamModel, ProjectModel } from '@console/internal/models';
import DevPreviewBadge from '@console/shared/src/components/badges/DevPreviewBadge';
import { QUERY_PROPERTIES } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import QueryFocusApplication from '../QueryFocusApplication';
import { ImportTypes, ImportData } from './import-types';
import ImportForm from './ImportForm';

export type ImportPageProps = RouteComponentProps<{ ns?: string }>;

const ImportFlows = (t: TFunction): { [name: string]: ImportData } => ({
  git: {
    type: ImportTypes.git,
    title: t('devconsole~Import from Git'),
    buildStrategy: 'Source',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then((m) => m.default),
  },
  docker: {
    type: ImportTypes.docker,
    title: t('devconsole~Import from Dockerfile'),
    buildStrategy: 'Docker',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then((m) => m.default),
  },
  devfile: {
    type: ImportTypes.devfile,
    title: t('devconsole~Import from Devfile'),
    buildStrategy: 'Devfile',
    loader: () =>
      import('./devfile/DevfileImportForm' /* webpackChunkName: "devfile-import-form" */).then(
        (m) => m.default,
      ),
  },
  s2i: {
    type: ImportTypes.s2i,
    title: t('devconsole~Create Source-to-Image Application'),
    buildStrategy: 'Source',
    loader: () =>
      import('./SourceToImageForm' /* webpackChunkName: "source-to-image-form" */).then(
        (m) => m.default,
      ),
  },
});

const ImportPage: React.FunctionComponent<ImportPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const imageStreamName = searchParams.get('imagestream');
  const imageStreamNamespace = searchParams.get('imagestream-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const importType = searchParams.get('importType');

  let importData: ImportData;
  let resources: FirehoseResource[];
  if (imageStreamName && imageStreamNamespace) {
    importData = ImportFlows(t).s2i;
    resources = [
      {
        kind: ImageStreamModel.kind,
        prop: 'imageStreams',
        isList: false,
        name: imageStreamName,
        namespace: imageStreamNamespace,
      },
      {
        kind: ProjectModel.kind,
        prop: 'projects',
        isList: true,
      },
    ];
  } else if (importType === ImportTypes.docker) {
    importData = ImportFlows(t).docker;
    resources = [
      {
        kind: ProjectModel.kind,
        prop: 'projects',
        isList: true,
      },
    ];
  } else if (importType === ImportTypes.devfile) {
    importData = ImportFlows(t).devfile;
    resources = [
      {
        kind: ProjectModel.kind,
        prop: 'projects',
        isList: true,
      },
    ];
  } else {
    importData = ImportFlows(t).git;
    resources = [
      {
        kind: ImageStreamModel.kind,
        prop: 'imageStreams',
        isList: true,
        namespace: 'openshift',
      },
      {
        kind: ProjectModel.kind,
        prop: 'projects',
        isList: true,
      },
    ];
  }

  return (
    <QueryFocusApplication>
      {(application) => (
        <NamespacedPage disabled variant={NamespacedPageVariants.light}>
          <Helmet>
            <title>{importData.title}</title>
          </Helmet>
          <PageHeading
            title={importData.title}
            badge={importType === ImportTypes.devfile ? <DevPreviewBadge /> : null}
          />
          <Firehose resources={resources}>
            <ImportForm
              forApplication={application}
              contextualSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
              namespace={namespace || preselectedNamespace}
              importData={importData}
            />
          </Firehose>
        </NamespacedPage>
      )}
    </QueryFocusApplication>
  );
};

export default ImportPage;
