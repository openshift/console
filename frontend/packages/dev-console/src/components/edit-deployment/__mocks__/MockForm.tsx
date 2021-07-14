import * as React from 'react';
import { Formik } from 'formik';
import { mockEditDeploymentData } from './edit-deployment-data';

const MockForm: React.FC<{
  initialValues?: any;
  children: (props) => React.ReactNode;
  handleSubmit: (values) => void;
  handleReset?: () => void;
}> = ({ initialValues, children, handleSubmit, handleReset }) => (
  <Formik
    initialValues={initialValues || mockEditDeploymentData}
    onSubmit={(values) => handleSubmit(values)}
    onReset={handleReset}
  >
    {(formikProps) =>
      children({
        ...formikProps,
      })
    }
  </Formik>
);

export default MockForm;
