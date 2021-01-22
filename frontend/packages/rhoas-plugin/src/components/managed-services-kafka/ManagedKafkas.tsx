import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { FormFooter } from '@console/shared';
import { history } from '@console/internal/components/utils';
import './ManagedKafkas.css';

const ManagedKafkas = () => {

  const handleNext = ()=>{

  }

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <div className="co-m-pane__body" style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}>
          <FormFooter
            handleSubmit={() => handleNext()}
            isSubmitting={false}
            errorMessage=""
            submitLabel={"Create"}
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
