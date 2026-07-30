import type { FC } from 'react';
import { useState } from 'react';
import type { FormikValues } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressiveList } from '@console/shared/src/components/progressive-list/ProgressiveList';
import { ProgressiveListItem } from '@console/shared/src/components/progressive-list/ProgressiveListItem';
import type { AppResources } from '../../edit-application/edit-application-types';
import HealthChecks from '../../health-checks/HealthChecks';
import { Resources } from '../import-types';
import FormSection from '../section/FormSection';
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

const Footer = ({ children }) => {
  const { t } = useTranslation('devconsole');
  return (
    <Trans
      t={t}
      ns="devconsole"
      i18nKey="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: FC<AdvancedSectionProps> = ({ appResources, values }) => {
  const { t } = useTranslation('devconsole');

  const [visibleItems, setVisibleItems] = useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
      Footer={Footer}
    >
      <ProgressiveListItem name={t('Health checks')}>
        <HealthChecks title={t('Health checks')} resourceType={values.resources} />
      </ProgressiveListItem>
      {values?.formType === 'edit' ? (
        <ProgressiveListItem name={t('Deployment')}>
          <DeploymentConfigSection
            namespace={values.project.name}
            resource={appResources?.editAppResource?.data}
          />
        </ProgressiveListItem>
      ) : null}

      <ProgressiveListItem name={t('Scaling')}>
        {values.resources === Resources.KnativeService ? (
          <ServerlessScalingSection />
        ) : (
          <ScalingSection name="deployment.replicas" />
        )}
      </ProgressiveListItem>
      <ProgressiveListItem name={t('Resource limits')}>
        <ResourceLimitSection />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('Labels')}>
        <LabelSection />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const AdvancedSection: FC<AdvancedSectionProps> = ({ values, appResources }) => {
  const { t } = useTranslation('devconsole');
  return (
    <FormSection title={t('Advanced options')}>
      <RouteSection route={values.route} resources={values.resources} />
      <div>
        <List appResources={appResources} values={values} />
      </div>
    </FormSection>
  );
};

export default AdvancedSection;
