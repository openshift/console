import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import ImportForm from './ImportForm';

export type ImportPageProps = RouteComponentProps<{ ns?: string }>;

const ImportPage: React.FunctionComponent<ImportPageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const imageStreamName = searchParams.get('imagestream');
  const imageStreamNamespace = searchParams.get('imagestream-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const isS2I = !!(imageStreamName && imageStreamNamespace);
  const resources = [
    {
      kind: ImageStreamModel.kind,
      prop: 'imageStreams',
      isList: !isS2I,
      ...(isS2I ? { name: imageStreamName, namespace: imageStreamNamespace } : {}),
    },
  ];
  const title = isS2I ? 'Create Source-to-Image Application' : 'Git Import';

  return (
    <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} />
      <div className="co-m-pane__body">
        <Firehose resources={resources}>
          <ImportForm namespace={namespace || preselectedNamespace} isS2I={isS2I} />
        </Firehose>
      </div>
    </React.Fragment>
  );
};

export default ImportPage;
