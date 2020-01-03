import * as React from 'react';
import { FormikValues } from 'formik';
import ProgressiveList from '../../progressive-list/ProgressiveList';
import ProgressiveListItem from '../../progressive-list/ProgressiveListItem';
import RouteSection from '../route/RouteSection';
import ServerlessRouteSection from '../serverless/ServerlessRouteSection';
import FormSection from '../section/FormSection';
import RouteCheckbox from '../route/RouteCheckbox';
import { Resources } from '../import-types';
import LabelSection from './LabelSection';
import ScalingSection from './ScalingSection';
import ServerlessScalingSection from './ServerlessScalingSection';
import BuildConfigSection from './BuildConfigSection';
import DeploymentConfigSection from './DeploymentConfigSection';
import ResourceLimitSection from './ResourceLimitSection';

export interface AdvancedSectionProps {
  values: FormikValues;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ values }) => {
  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <FormSection title="Advanced Options" fullWidth>
      {values.route.show && <RouteCheckbox />}
      <ProgressiveList
        text="Click on the names to access advanced options for"
        visibleItems={visibleItems}
        onVisibleItemChange={handleVisibleItemChange}
      >
        <ProgressiveListItem name="Routing">
          {values.resources === Resources.KnativeService ? (
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
        {values.resources !== Resources.KnativeService && (
          <ProgressiveListItem name="Deployment">
            <DeploymentConfigSection namespace={values.project.name} />
          </ProgressiveListItem>
        )}
        <ProgressiveListItem name="Scaling">
          {values.resources === Resources.KnativeService ? (
            <ServerlessScalingSection />
          ) : (
            <ScalingSection />
          )}
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
