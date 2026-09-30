import type { ReactNode, FC } from 'react';
import { Formik } from 'formik';
import { mockEditDeploymentData } from './deployment-data';

const MockForm: FC<{
  initialValues?: any;
  enableReinitialize?: boolean;
  children: (props) => ReactNode;
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
