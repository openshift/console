import * as React from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Pipeline } from '../../../../utils/pipeline-augment';
import TriggerTemplateSelector from './TriggerTemplateSelector';

type RemoveTriggerFormProps = {
  pipeline: Pipeline;
};

const RemoveTriggerForm: React.FC<RemoveTriggerFormProps> = (props) => {
  const { pipeline } = props;

  return (
    <Split className="odc-modal-content" hasGutter>
      <SplitItem>
        <ExclamationTriangleIcon size="md" color={warningColor.value} />
      </SplitItem>
      <SplitItem isFilled>
        <p className="co-break-word">
          Select the trigger to remove from pipeline <b>{pipeline.metadata.name}</b>.
        </p>
        <TriggerTemplateSelector
          name="selectedTrigger"
          placeholder="Select Trigger Template"
          pipeline={pipeline}
        />
      </SplitItem>
    </Split>
  );
};

export default RemoveTriggerForm;
