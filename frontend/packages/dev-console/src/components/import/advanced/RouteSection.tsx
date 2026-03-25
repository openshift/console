import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared';
import type { Resources, RouteData } from '../import-types';
import AdvancedRouteOptions from '../route/AdvancedRouteOptions';
import PortInputField from '../route/PortInputField';

interface RouteSectionProps {
  route: RouteData;
  resources: Resources;
}

const RouteSection: FC<RouteSectionProps> = ({ route, resources }) => {
  const { t } = useTranslation();
  const { defaultUnknownPort, disable, create } = route;

  return (
    <>
      <PortInputField defaultPort={defaultUnknownPort} />
      <CheckboxField
        name="route.create"
        label={t('devconsole~Create a route')}
        helpText={t('devconsole~Exposes your component at a public URL')}
        isDisabled={disable}
      />
      <AdvancedRouteOptions canCreateRoute={create} resources={resources} />
    </>
  );
};

export default RouteSection;
