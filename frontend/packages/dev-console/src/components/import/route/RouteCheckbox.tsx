import * as React from 'react';
import { CheckboxField } from '@console/shared';

interface RouteCheckboxProps {
  isDisabled?: boolean;
}

const RouteCheckbox: React.FC<RouteCheckboxProps> = ({ isDisabled }) => {
  return (
    <CheckboxField
      name="route.create"
      label="Create a route to the application"
      helpText="Exposes your application at a public URL"
      isDisabled={isDisabled}
    />
  );
};

export default RouteCheckbox;
