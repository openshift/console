import * as React from 'react';
import { FormikValues } from 'formik';
import ProgressiveList from '../../progressive-list/ProgressiveList';
import ProgressiveListItem from '../../progressive-list/ProgressiveListItem';
import RouteSection from '../route/RouteSection';
import LabelSection from './LabelSection';
import ScalingSection from './ScalingSection';
import ServerlessScalingSection from './ServerlessScalingSection';
import BuildConfigSection from './BuildConfigSection';
import DeploymentConfigSection from './DeploymentConfigSection';

export interface AdvancedSectionProps {
  values: FormikValues;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ values }) => {
  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      text="Go to Advanced Options for"
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
    >
      <ProgressiveListItem name="Route">
        <RouteSection route={values.route} />
      </ProgressiveListItem>
      <ProgressiveListItem name="Labels">
        <LabelSection />
      </ProgressiveListItem>
      <ProgressiveListItem name="Scale">
        {values.serverless.trigger ? <ServerlessScalingSection /> : <ScalingSection />}
      </ProgressiveListItem>
      <ProgressiveListItem name="Build Config">
        <BuildConfigSection namespace={values.project.name} />
      </ProgressiveListItem>
      <ProgressiveListItem name="Deployment Config">
        <DeploymentConfigSection namespace={values.project.name} />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

export default AdvancedSection;
