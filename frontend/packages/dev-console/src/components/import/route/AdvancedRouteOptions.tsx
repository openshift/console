import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import { Resources } from '../import-types';
import FormSection from '../section/FormSection';
import ServerlessRouteSection from '../serverless/ServerlessRouteSection';
import CreateRoute from './CreateRoute';
import SecureRoute from './SecureRoute';

type AdvancedRouteOptionsProps = {
  canCreateRoute: boolean;
  resources: Resources;
};

const AdvancedRouteOptions: React.FC<AdvancedRouteOptionsProps> = ({
  canCreateRoute,
  resources,
}) => {
  const { t } = useTranslation();
  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Hide advanced Routing options')}
      textCollapsed={t('devconsole~Show advanced Routing options')}
    >
      <FormSection>
        {canCreateRoute ? (
          resources === Resources.KnativeService ? (
            <ServerlessRouteSection />
          ) : (
            <>
              <CreateRoute />
              <SecureRoute />
            </>
          )
        ) : (
          <Alert
            variant="info"
            isInline
            title={t(
              'devconsole~Select the checkbox "Create a route to the application" to edit advanced routing options',
            )}
          />
        )}
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedRouteOptions;
