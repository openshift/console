import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import CreateBackingStoreForm from './create-bs';
import './create-bs.scss';

const CreateBackingStoreFormPage: React.FC<CreateBackingStoreFormPageProps> = ({ match }) => {
  const [showHelp, setShowHelp] = React.useState(true);
  const onCancel = () => {
    history.goBack();
  };
  const namespace = match.params.ns;
  return (
    <div className="nb-bs-page">
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
      <CreateBackingStoreForm cancel={onCancel} isPage namespace={namespace} />
    </div>
  );
};

type CreateBackingStoreFormPageProps = RouteComponentProps<{ ns?: string }>;

export default CreateBackingStoreFormPage;
