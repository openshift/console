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
      label={t('devconsole~Create a Route to the Application')}
      helpText={t('devconsole~Exposes your Application at a public URL')}
      isDisabled={isDisabled}
    />
  );
};

export default RouteCheckbox;
