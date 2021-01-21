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
        <FormFooter
          isSubmitting={false}
          errorMessage=""
          submitLabel="Create"
          disableSubmit={false}
          resetLabel="Reset"
          sticky
          handleCancel={history.goBack}
        />
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;