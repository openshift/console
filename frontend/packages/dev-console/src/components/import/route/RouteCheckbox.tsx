import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared';

interface RouteCheckboxProps {
  isDisabled?: boolean;
}

const RouteCheckbox: React.FC<RouteCheckboxProps> = ({ isDisabled }) => {
  const { t } = useTranslation();
  return (
    <CheckboxField
      name="route.create"
      label={t('devconsole~Create a route to the application')}
      helpText={t('devconsole~Exposes your application at a public URL')}
      isDisabled={isDisabled}
    />
  );
};

export default RouteCheckbox;
