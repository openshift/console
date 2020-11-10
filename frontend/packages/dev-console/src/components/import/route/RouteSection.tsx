import * as React from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '../section/FormSection';
import { RouteData } from '../import-types';
import CreateRoute from './CreateRoute';
import SecureRoute from './SecureRoute';

interface RouteSectionProps {
  route: RouteData;
}

const RouteSection: React.FC<RouteSectionProps> = ({ route }) => {
  const { t } = useTranslation();
  return (
    <FormSection title={t('devconsole~Routing')}>
      {route.create && (
        <>
          <CreateRoute />
          <SecureRoute />
        </>
      )}
    </FormSection>
  );
};

export default RouteSection;
