import * as React from 'react';
import { FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { AppResources } from '../../edit-application/edit-application-types';
import HealthChecks from '../../health-checks/HealthChecks';
import ProgressiveList from '../../progressive-list/ProgressiveList';
import ProgressiveListItem from '../../progressive-list/ProgressiveListItem';
import { Resources } from '../import-types';
import RouteCheckbox from '../route/RouteCheckbox';
import FormSection from '../section/FormSection';
import BuildConfigSection from './BuildConfigSection';
import DeploymentConfigSection from './DeploymentConfigSection';
import LabelSection from './LabelSection';
import ResourceLimitSection from './ResourceLimitSection';
import ScalingSection from './ScalingSection';
import ServerlessScalingSection from './ServerlessScalingSection';

export interface AdvancedSectionProps {
  values: FormikValues;
  appResources?: AppResources;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ values, appResources }) => {
  const { t } = useTranslation();
  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <FormSection title={t('devconsole~Advanced options')} fullWidth>
      <RouteCheckbox route={values.route} resources={values.resources} />
      <ProgressiveList
        text={t('devconsole~Click on the names to access advanced options for')}
        visibleItems={visibleItems}
        onVisibleItemChange={handleVisibleItemChange}
      >
        <ProgressiveListItem name={t('devconsole~Health checks')}>
          <HealthChecks title={t('devconsole~Health checks')} resourceType={values.resources} />
        </ProgressiveListItem>
        {/* Hide Build for Deploy Image or when a Pipeline is added */}
        {values.isi || values.pipeline?.enabled ? null : (
          <ProgressiveListItem name={t('devconsole~Build configuration')}>
            <BuildConfigSection
              namespace={values.project.name}
              resource={appResources?.buildConfig?.data}
            />
          </ProgressiveListItem>
        )}
        <ProgressiveListItem name={t('devconsole~Deployment')}>
          <DeploymentConfigSection
            namespace={values.project.name}
            resource={appResources?.editAppResource?.data}
          />
        </ProgressiveListItem>
        <ProgressiveListItem name={t('devconsole~Scaling')}>
          {values.resources === Resources.KnativeService ? (
            <ServerlessScalingSection />
          ) : (
            <ScalingSection name="deployment.replicas" />
          )}
        </ProgressiveListItem>
        <ProgressiveListItem name={t('devconsole~Resource limits')}>
          <ResourceLimitSection />
        </ProgressiveListItem>
        <ProgressiveListItem name={t('devconsole~Labels')}>
          <LabelSection />
        </ProgressiveListItem>
      </ProgressiveList>
    </FormSection>
  );
};

export default AdvancedSection;
