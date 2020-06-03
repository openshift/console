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
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
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
            Create new Backing Store
          </Title>
          <p className="nb-bs-page-title__info">
            Storage targets that are used to store chunks of data on MCG buckets.
          </p>
        </div>
      </div>
      <div className="nb-bs-page">
        {showHelp && (
          <Alert
            isInline
            variant="info"
            title="What is a Backing Store?"
            actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
          >
            A backing store represents a storage target to be used as the underlying storage layer
            in MCG buckets.
            <br />
            Multiple types of backing stores are supported: AWS S3, S3 Compatible, Google Cloud
            Storage, Azure Blob, PVC.
          </Alert>
        )}
        <CreateBackingStoreForm
          cancel={onCancel}
          isPage
          namespace={ns}
          className="nb-bs-page-form__short"
          csv={clusterServiceVersion}
        />
      </div>
    </>
  );
};

type CreateBackingStoreFormPageProps = RouteComponentProps<{ ns?: string; appName?: string }>;

export default CreateBackingStoreFormPage;
