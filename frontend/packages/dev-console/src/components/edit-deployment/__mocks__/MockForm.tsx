import * as React from 'react';
import { Formik } from 'formik';
import { mockEditDeploymentData } from './edit-deployment-data';

const MockForm: React.FC<{
  initialValues?: any;
  enableReinitialize?: boolean;
  children: (props) => React.ReactNode;
  handleSubmit: (values) => void;
  handleReset?: () => void;
}> = ({ initialValues, children, handleSubmit, handleReset, enableReinitialize = false }) => (
  <Formik
    initialValues={initialValues || mockEditDeploymentData}
    onSubmit={(values) => handleSubmit(values)}
    onReset={handleReset}
    enableReinitialize={enableReinitialize}
  >
    {(formikProps) =>
      children({
        ...formikProps,
      })
    }
  </Formik>
);

export default MockForm;
