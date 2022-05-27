import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { PageSection } from '@patternfly/react-core';

const ProjectTabExtensionContent: React.FC<RouteComponentProps> = () => {
  return <PageSection>This is the demo plugin addition for the project model.</PageSection>;
};

export default ProjectTabExtensionContent;
