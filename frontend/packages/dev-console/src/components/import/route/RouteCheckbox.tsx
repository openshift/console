import * as React from 'react';
import { CheckboxField } from '../../formik-fields';

const RouteCheckbox: React.FC = () => {
  return (
    <CheckboxField
      type="checkbox"
      name="route.create"
      label="Create a route to the application"
      helpText="Exposes your application at a public URL"
    />
  );
};

export default RouteCheckbox;
