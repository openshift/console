import * as React from 'react';
import { FormikValues } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressiveList, ProgressiveListItem } from '@console/shared/src';
import { AppResources } from '../../edit-application/edit-application-types';
import HealthChecks from '../../health-checks/HealthChecks';
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

const Footer = ({ children }) => {
  const { t } = useTranslation();
  return (
    <Trans
      t={t}
      ns="devconsole"
      defaults="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: React.FC<AdvancedSectionProps> = ({ appResources, values }) => {
  const { t } = useTranslation();

  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
      Footer={Footer}
    >
      <ProgressiveListItem name={t('devconsole~Health checks')}>
        <div
          style={
            visibleItems[0] === 'Health checks'
              ? { marginTop: 'var(--pf-global--spacer--lg)' }
              : { marginTop: 'var(--pf-global--spacer--2xl)' }
          }
        >
          <HealthChecks title={t('devconsole~Health checks')} resourceType={values.resources} />
        </div>
      </ProgressiveListItem>
      {/* Hide Build for Deploy Image or when a Pipeline is added */}
      {values.isi || values.pipeline?.enabled ? null : (
        <ProgressiveListItem name={t('devconsole~Build configuration')}>
          <div
            style={
              visibleItems[0] === 'Build configuration'
                ? { marginTop: 'var(--pf-global--spacer--lg)' }
                : { marginTop: 'var(--pf-global--spacer--2xl)' }
            }
          >
            <BuildConfigSection
              namespace={values.project.name}
              resource={appResources?.buildConfig?.data}
            />
          </div>
        </ProgressiveListItem>
      )}
      <ProgressiveListItem name={t('devconsole~Deployment')}>
        <div
          style={
            visibleItems[0] === 'Deployment'
              ? { marginTop: 'var(--pf-global--spacer--lg)' }
              : { marginTop: 'var(--pf-global--spacer--2xl)' }
          }
        >
          <DeploymentConfigSection
            namespace={values.project.name}
            resource={appResources?.editAppResource?.data}
          />
        </div>
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Scaling')}>
        <div
          style={
            visibleItems[0] === 'Scaling'
              ? { marginTop: 'var(--pf-global--spacer--lg)' }
              : { marginTop: 'var(--pf-global--spacer--2xl)' }
          }
        >
          {values.resources === Resources.KnativeService ? (
            <ServerlessScalingSection />
          ) : (
            <ScalingSection name="deployment.replicas" />
          )}
        </div>
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Resource limits')}>
        <div
          style={
            visibleItems[0] === 'Resource limits'
              ? { marginTop: 'var(--pf-global--spacer--lg)' }
              : { marginTop: 'var(--pf-global--spacer--2xl)' }
          }
        >
          <ResourceLimitSection />
        </div>
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Labels')}>
        <div
          style={
            visibleItems[0] === 'Labels'
              ? { marginTop: 'var(--pf-global--spacer--lg)' }
              : { marginTop: 'var(--pf-global--spacer--2xl)' }
          }
        >
          <LabelSection />
        </div>
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
        <List appResources={appResources} values={values} />
      </div>
    </FormSection>
  );
};

export default AdvancedSection;
