import * as React from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { Firehose } from '@console/internal/components/utils';
import BuildSource from './SourceToImage';

export type SourceToImagePage = RouteComponentProps<{
  imagestream: string;
  'imagestream-ns': string;
  'preselected-ns': string;
}>;

export const SourceToImagePage: React.FC<SourceToImagePage> = ({ match }) => {
  const title = 'Create Source-to-Image Application';
  const {
    imagestream: imageStreamName,
    'imagestream-ns': imageStreamNamespace,
    'preselected-ns': preselectedNamespace,
  } = match.params;
  const resources = [
    {
      kind: 'ImageStream',
      name: imageStreamName,
      namespace: imageStreamNamespace,
      isList: false,
      prop: 'obj',
    },
  ];

  return (
    <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading">{title}</h1>
        <Firehose resources={resources}>
          <BuildSource preselectedNamespace={preselectedNamespace} />
        </Firehose>
      </div>
    </React.Fragment>
  );
};

export default SourceToImagePage;
