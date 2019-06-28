import * as React from 'react';
import { CheckboxField } from '../../formik-fields';
import FormSection from '../section/FormSection';
import CreateRoute from './CreateRoute';
import SecureRoute from './SecureRoute';
import { RouteData } from '../import-types';

interface RouteSectionProps {
  route: RouteData;
}

const RouteSection: React.FC<RouteSectionProps> = ({ route }) => {
  return (
    <FormSection title="Routing">
      <CheckboxField
        type="checkbox"
        name="route.create"
        label="Create a route to the application"
      />
      {route.create && (
        <React.Fragment>
          <CreateRoute />
          <SecureRoute />
        </React.Fragment>
      )}
    </FormSection>
  );
};

export default RouteSection;
