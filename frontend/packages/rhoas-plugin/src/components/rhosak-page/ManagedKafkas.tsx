import * as React from 'react';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import AccessManagedServices from '../access-managed-services/AccessManagedServices';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { FormFooter } from '@console/shared';
import { history } from '@console/internal/components/utils';
import './ManagedKafkas.css';

const ManagedKafkas = () => {

  const [authenticationSuccess, setAuthenticationSuccess] = React.useState(false);

  const handleNext = () => {
    setAuthenticationSuccess(true);
  }

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        { !authenticationSuccess &&
          <AccessManagedServices 
            authenticationSuccess={authenticationSuccess}
            setAuthenticationSuccess={setAuthenticationSuccess}
          />
        }
        { authenticationSuccess &&
          <StreamsInstancePage />
        }
        <div className="co-m-pane__body" style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}>
          <FormFooter
            handleSubmit={() => handleNext()}
            isSubmitting={false}
            errorMessage=""
            submitLabel={ authenticationSuccess ? "Create" : "Next" }
            disableSubmit={false}
            resetLabel="Reset"
            sticky
            handleCancel={history.goBack}
          />
        </div>
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;