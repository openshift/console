import * as React from 'react';
import { FormikValues } from 'formik';
import ProgressiveList from '../../progressive-list/ProgressiveList';
import ProgressiveListItem from '../../progressive-list/ProgressiveListItem';
import RouteSection from '../route/RouteSection';
import ServerlessRouteSection from '../serverless/ServerlessRouteSection';
import FormSection from '../section/FormSection';
import RouteCheckbox from '../route/RouteCheckbox';
import LabelSection from './LabelSection';
import ScalingSection from './ScalingSection';
import ServerlessScalingSection from './ServerlessScalingSection';
import BuildConfigSection from './BuildConfigSection';
import DeploymentConfigSection from './DeploymentConfigSection';
import ResourceLimitSection from './ResourceLimitSection';

export interface AdvancedSectionProps {
  values: FormikValues;
}

const ROUTING_NAME = 'Routing';

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ values }) => {
  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  const needsPort = values.route.supplyPort;
  React.useEffect(() => {
    if (needsPort && !visibleItems.includes(ROUTING_NAME)) {
      setVisibleItems([...visibleItems, ROUTING_NAME]);
    }
  }, [needsPort, visibleItems]);

  return (
    <FormSection title="Advanced Options" fullWidth>
      <RouteCheckbox />
      <ProgressiveList
        text="Click on the names to access advanced options for"
        visibleItems={visibleItems}
        onVisibleItemChange={handleVisibleItemChange}
      >
        <ProgressiveListItem disableScroll={needsPort} name={ROUTING_NAME}>
          {values.serverless.enabled ? (
            <ServerlessRouteSection route={values.route} />
          ) : (
            <RouteSection route={values.route} />
          )}
        </ProgressiveListItem>
        {/* Hide Build for Deploy Image */}
        {values.isi ? null : (
          <ProgressiveListItem name="Build Configuration">
            <BuildConfigSection namespace={values.project.name} />
          </ProgressiveListItem>
        )}
        {/* Hide Deployment for Serverless */}
        {values.serverless.enabled ? null : (
          <ProgressiveListItem name="Deployment Configuration">
            <DeploymentConfigSection namespace={values.project.name} />
          </ProgressiveListItem>
        )}
        <ProgressiveListItem name="Scaling">
          {values.serverless.enabled ? <ServerlessScalingSection /> : <ScalingSection />}
        </ProgressiveListItem>
        <ProgressiveListItem name="Resource Limits">
          <ResourceLimitSection />
        </ProgressiveListItem>
        <ProgressiveListItem name="Labels">
          <LabelSection />
        </ProgressiveListItem>
      </ProgressiveList>
    </FormSection>
  );
};

export default AdvancedSection;
