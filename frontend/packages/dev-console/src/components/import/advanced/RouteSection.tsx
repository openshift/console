import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import type { Resources, RouteData } from '../import-types';
import AdvancedRouteOptions from '../route/AdvancedRouteOptions';
import PortInputField from '../route/PortInputField';

interface RouteSectionProps {
  route: RouteData;
  resources: Resources;
}

const RouteSection: FC<RouteSectionProps> = ({ route, resources }) => {
  const { t } = useTranslation('devconsole');
  const { defaultUnknownPort, disable, create } = route;

  return (
    <>
      <PortInputField defaultPort={defaultUnknownPort} />
      <CheckboxField
        name="route.create"
        label={t('Create a route')}
        helpText={t('Exposes your component at a public URL')}
        isDisabled={disable}
      />
      <AdvancedRouteOptions canCreateRoute={create} resources={resources} />
    </>
  );
};

export default RouteSection;
