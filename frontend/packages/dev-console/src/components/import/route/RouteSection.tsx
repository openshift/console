import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import FormSection from '../section/FormSection';
import { RouteData } from '../import-types';
import CreateRoute from './CreateRoute';
import SecureRoute from './SecureRoute';

interface RouteSectionProps {
  route: RouteData;
}

const RouteSection: React.FC<RouteSectionProps> = ({ route }) => {
  const {
    values: {
      serverless: { enabled: serverlessEnabled },
    },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection title="Routing">
      {route.create && (
        <React.Fragment>
          <CreateRoute />
          {!serverlessEnabled && <SecureRoute />}
        </React.Fragment>
      )}
    </FormSection>
  );
};

export default RouteSection;
