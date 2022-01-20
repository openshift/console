import * as React from 'react';
import { FormikValues } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { AppResources } from '../../edit-application/edit-application-types';
import HealthChecks from '../../health-checks/HealthChecks';
import ProgressiveList from '../../progressive-list/ProgressiveList';
import ProgressiveListItem from '../../progressive-list/ProgressiveListItem';
import { Resources } from '../import-types';
import FormSection from '../section/FormSection';
import BuildConfigSection from './BuildConfigSection';
import DeploymentConfigSection from './DeploymentConfigSection';
import LabelSection from './LabelSection';
import ResourceLimitSection from './ResourceLimitSection';
import RouteSection from './RouteSection';
import ScalingSection from './ScalingSection';
import ServerlessScalingSection from './ServerlessScalingSection';

type AdvancedSectionProps = {
  values: FormikValues;
  appResources?: AppResources;
};

const List: React.FC<AdvancedSectionProps> = ({ appResources, values }) => {
  const { t } = useTranslation();

  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList visibleItems={visibleItems} onVisibleItemChange={handleVisibleItemChange}>
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
  );
};

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ values, appResources }) => {
  const { t } = useTranslation();

  return (
    <FormSection title={t('devconsole~Advanced options')}>
      <RouteSection route={values.route} resources={values.resources} />
      <div>
        <Trans ns="devconsole">
          {'Click on the names to access advanced options for '}
          <List appResources={appResources} values={values} />.
        </Trans>
      </div>
    </FormSection>
  );
};

export default AdvancedSection;
