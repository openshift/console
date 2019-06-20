import * as React from 'react';
import { match as RMatch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import GitImport from './GitImport';

export interface ImportPageProps {
  match: RMatch<{ ns?: string }>;
}

const ImportPage: React.FunctionComponent<ImportPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  return (
    <React.Fragment>
      <Helmet>
        <title>Import from Git</title>
      </Helmet>
      <PageHeading title="Git Import" />
      <div className="co-m-pane__body">
        <Firehose resources={[{ kind: ImageStreamModel.kind, prop: 'imageStreams', isList: true }]}>
          <GitImport namespace={namespace} />
        </Firehose>
      </div>
    </React.Fragment>
  );
};

export default ImportPage;
