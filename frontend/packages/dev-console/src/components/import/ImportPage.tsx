import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, Firehose, FirehoseResource } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import ImportForm from './ImportForm';
import { ImportTypes, ImportData } from './import-types';

export type ImportPageProps = RouteComponentProps<{ ns?: string }>;

const ImportFlows: { [name: string]: ImportData } = {
  git: {
    type: ImportTypes.git,
    title: 'Import from git',
    buildStrategy: 'Source',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then((m) => m.default),
  },
  docker: {
    type: ImportTypes.docker,
    title: 'Import from Dockerfile',
    buildStrategy: 'Docker',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then((m) => m.default),
  },
  s2i: {
    type: ImportTypes.s2i,
    title: 'Create Source-to-Image Application',
    buildStrategy: 'Source',
    loader: () =>
      import('./SourceToImageForm' /* webpackChunkName: "source-to-image-form" */).then(
        (m) => m.default,
      ),
  },
};

const ImportPage: React.FunctionComponent<ImportPageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const imageStreamName = searchParams.get('imagestream');
  const imageStreamNamespace = searchParams.get('imagestream-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const importType = searchParams.get('importType');

  let importData: ImportData;
  let resources: FirehoseResource[];
  if (imageStreamName && imageStreamNamespace) {
    importData = ImportFlows.s2i;
    resources = [
      {
        kind: ImageStreamModel.kind,
        prop: 'imageStreams',
        isList: false,
        name: imageStreamName,
        namespace: imageStreamNamespace,
      },
    ];
  } else if (importType === ImportTypes.docker) {
    importData = ImportFlows.docker;
    resources = [];
  } else {
    importData = ImportFlows.git;
    resources = [
      {
        kind: ImageStreamModel.kind,
        prop: 'imageStreams',
        isList: true,
      },
    ];
  }

  return (
    <React.Fragment>
      <Helmet>
        <title>{importData.title}</title>
      </Helmet>
      <PageHeading title={importData.title} />
      <div className="co-m-pane__body">
        <Firehose resources={resources}>
          <ImportForm namespace={namespace || preselectedNamespace} importData={importData} />
        </Firehose>
      </div>
    </React.Fragment>
  );
};

export default ImportPage;
