import * as React from 'react';
import { CheckboxField } from '@console/shared/src/components/formik-fields';

const RouteCheckbox: React.FC = () => {
  return (
    <CheckboxField
      name="route.create"
      label="Create a route to the application"
      helpText="Exposes your application at a public URL"
    />
  );
};

export default RouteCheckbox;
