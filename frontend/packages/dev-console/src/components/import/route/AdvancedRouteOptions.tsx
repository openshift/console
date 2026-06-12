import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import { SelectorInputField } from '@console/shared/src/components/formik-fields/SelectorInputField';
import { Resources } from '../import-types';
import FormSection from '../section/FormSection';
import ServerlessRouteSection from '../serverless/ServerlessRouteSection';
import CreateRoute from './CreateRoute';
import SecureRoute from './SecureRoute';

type AdvancedRouteOptionsProps = {
  canCreateRoute: boolean;
  resources: Resources;
};

const AdvancedRouteOptions: FC<AdvancedRouteOptionsProps> = ({ canCreateRoute, resources }) => {
  const { t } = useTranslation('devconsole');
  return (
    <ExpandCollapse
      textExpanded={t('Hide advanced Routing options')}
      textCollapsed={t('Show advanced Routing options')}
    >
      <FormSection>
        {canCreateRoute ? (
          resources === Resources.KnativeService ? (
            <ServerlessRouteSection />
          ) : (
            <>
              <CreateRoute />
              <SecureRoute />
              <SelectorInputField
                name="route.labels"
                label={t('Labels')}
                helpText={t('Additional labels which are only added to the Route resource.')}
                placeholder="app.io/type=frontend"
                dataTest="route-labels"
              />
            </>
          )
        ) : (
          <Alert
            variant="info"
            isInline
            title={t('Select the checkbox "Create a route" to edit advanced routing options')}
          />
        )}
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedRouteOptions;
