import * as React from 'react';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router';
import { Alert, AlertActionCloseButton, Title } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { BreadCrumbs, resourcePathFromModel } from '@console/internal/components/utils';
import { k8sGet } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { NooBaaBackingStoreModel } from '../../models';
import CreateBackingStoreForm from './create-bs';
import './create-bs.scss';

const CreateBackingStoreFormPage: React.FC<CreateBackingStoreFormPageProps> = ({ match }) => {
  const [showHelp, setShowHelp] = React.useState(true);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);
  const { ns, appName } = match.params;

  const onCancel = () => {
    history.goBack();
  };

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        setClusterServiceVersion(clusterServiceVersionObj);
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, ns]);

  return (
    <div className="nb-bs-page">
      <div className="nb-bs-page__breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            {
              name: _.get(
                clusterServiceVersion,
                'spec.displayName',
                'Openshift Container Storage Operator',
              ),
              path: resourcePathFromModel(ClusterServiceVersionModel, appName, ns),
            },
            { name: `Create ${NooBaaBackingStoreModel.label}`, path: match.url },
          ]}
        />
      </div>
      <div className="nb-bs-page-title">
        <Title size="2xl" headingLevel="h1" className="nb-bs-page-title__main">
          Create new BackingStore
        </Title>
        <p className="nb-bs-page-title__info">
          Storage targets that are used to store chunks of data on MCG buckets.
        </p>
      </div>
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title="What is a BackingStore?"
          action={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          BackingStore represent a storage target to be used as the underlying storage for the data
          in MCG buckets.
          <br />
          Multiple types of backing-stores are supported: aws-s3, s3-compataible,
          google-cloud-storage, azure-blob, obc, PVC.
        </Alert>
      )}
      <CreateBackingStoreForm cancel={onCancel} isPage namespace={ns} />
    </div>
  );
};

type CreateBackingStoreFormPageProps = RouteComponentProps<{ ns?: string; appName?: string }>;

export default CreateBackingStoreFormPage;
