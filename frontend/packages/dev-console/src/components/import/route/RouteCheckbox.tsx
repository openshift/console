import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared';
import { Resources, RouteData } from '../import-types';
import AdvancedRouteOptions from './AdvancedRouteOptions';

interface RouteCheckboxProps {
  route: RouteData;
  resources: Resources;
}

const RouteCheckbox: React.FC<RouteCheckboxProps> = ({ route, resources }) => {
  const { t } = useTranslation();
  const { disable, create } = route;
  return (
    <>
      <CheckboxField
        name="route.create"
        label={t('devconsole~Create a route to the Application')}
        helpText={t('devconsole~Exposes your Application at a public URL')}
        isDisabled={disable}
      />
      <AdvancedRouteOptions canCreateRoute={create} resources={resources} />
    </>
  );
};

export default RouteCheckbox;
