import * as React from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { Trans, useTranslation } from 'react-i18next';
import { PipelineKind } from '../../../../types';
import TriggerTemplateSelector from './TriggerTemplateSelector';

type RemoveTriggerFormProps = {
  pipeline: PipelineKind;
};

const RemoveTriggerForm: React.FC<RemoveTriggerFormProps> = (props) => {
  const { t } = useTranslation();
  const { pipeline } = props;
  const pipelineName = pipeline.metadata.name;

  return (
    <Split className="odc-modal-content" hasGutter>
      <SplitItem>
        <ExclamationTriangleIcon size="md" color={warningColor.value} />
      </SplitItem>
      <SplitItem isFilled>
        <p className="co-break-word">
          <Trans t={t} ns="pipelines-plugin">
            Select the trigger to remove from pipeline <b>{{ pipelineName }}</b>.
          </Trans>
        </p>
        <TriggerTemplateSelector
          name="selectedTrigger"
          placeholder={t('pipelines-plugin~Select TriggerTemplate')}
          pipeline={pipeline}
        />
      </SplitItem>
    </Split>
  );
};

export default RemoveTriggerForm;
