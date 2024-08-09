import * as React from 'react';
import EnvironmentVariablesSection from '@console/dev-console/src/components/buildconfig/sections/EnvironmentVariablesSection';
import NameSection from '@console/dev-console/src/components/buildconfig/sections/NameSection';
import GitSection from '@console/dev-console/src/components/import/git/GitSection';
import SwitchToYAMLAlert from '@console/shared/src/components/alerts/SwitchToYAMLAlert';
import BuildStrategySelector from './BuildStrategySelector';
import ImageSection from './ImageSection';
import ParameterSection from './ParameterSection';
import VolumeSection from './VolumeSection';

type BuildFormEditorProps = {
  namespace: string;
};

const BuildFormEditor: React.FC<BuildFormEditorProps> = ({ namespace }) => {
  const [showYAMLAlert, setShowYAMLAlert] = React.useState<boolean>(true);
  return (
    <>
      {showYAMLAlert && <SwitchToYAMLAlert onClose={() => setShowYAMLAlert(false)} />}
      <NameSection />
      <GitSection title="Source" formContextField="formData.source.git" autoFocus={false} />
      <BuildStrategySelector namespace={namespace} />
      <ParameterSection />
      <VolumeSection namespace={namespace} />
      <ImageSection namespace={namespace} />
      <EnvironmentVariablesSection namespace={namespace} />
    </>
  );
};

export default BuildFormEditor;
