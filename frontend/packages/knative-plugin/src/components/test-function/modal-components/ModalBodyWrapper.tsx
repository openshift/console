import * as React from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik/dist/types';
import ModalCompact from './ModalCompact';
import RequestPane from './RequestPane';
import ResponsePane from './ResponsePane';
import '../TestFunctionModal.scss';

const ModalBodyWrapper: React.FC<FormikProps<FormikValues>> = (props) => {
  return (
    <>
      <div className="kn-test-sf-modal__split">
        <Split hasGutter>
          <SplitItem isFilled className="kn-test-sf-modal__splitItem">
            <RequestPane {...props} />
          </SplitItem>
          <SplitItem isFilled className="kn-test-sf-modal__splitItem">
            <ResponsePane {...props} />
          </SplitItem>
        </Split>
      </div>
      <div className="kn-test-sf-modal__tabbed">
        <ModalCompact {...props} />
      </div>
    </>
  );
};

export default ModalBodyWrapper;
