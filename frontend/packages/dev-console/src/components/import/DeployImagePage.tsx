import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import DeployImage from './DeployImage';

export type DeployImagePageProps = RouteComponentProps<{ ns?: string }>;

const DeployImagePage: React.FunctionComponent<DeployImagePageProps> = ({ match }) => {
  const namespace = match.params.ns;
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>Deploy Image</title>
      </Helmet>
      <PageHeading title="Deploy Image" />
      <div className="co-m-pane__body">
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <DeployImage namespace={namespace} />
        </Firehose>
      </div>
    </NamespacedPage>
  );
};

export default DeployImagePage;
