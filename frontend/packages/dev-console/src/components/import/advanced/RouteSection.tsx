import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared';
import { Resources, RouteData } from '../import-types';
import AdvancedRouteOptions from '../route/AdvancedRouteOptions';
import PortInputField from '../route/PortInputField';

interface RouteSectionProps {
  route: RouteData;
  resources: Resources;
}

const RouteSection: React.FC<RouteSectionProps> = ({ route, resources }) => {
  const { t } = useTranslation();
  const { disable, create, defaultUnknownPort } = route;

  return (
    <>
      <CheckboxField
        name="route.create"
        label={t('devconsole~Create a route to the Application')}
        helpText={t('devconsole~Exposes your Application at a public URL')}
        isDisabled={disable}
      />
      {create && <PortInputField defaultPort={defaultUnknownPort} />}
      <AdvancedRouteOptions canCreateRoute={create} resources={resources} />
    </>
  );
};

export default RouteSection;
