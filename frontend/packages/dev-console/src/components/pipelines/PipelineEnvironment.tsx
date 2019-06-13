import * as React from 'react';
import { AsyncComponent } from '@console/internal/components/utils';

const PipelineEnvironmentTab = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/environment.jsx').then((c) => c.EnvironmentPage)
    }
    {...props}
  />
);

const envPath = ['spec', 'containers'];
const PipelinenvironmentComponent = (props) => (
  <PipelineEnvironmentTab obj={props.obj} rawEnvData={props.obj.spec} envPath={envPath} readOnly />
);

export default PipelinenvironmentComponent;
