import * as React from 'react';
import { useField } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared/src';
import { PipelineKind } from '../../../../types';
import { RouteTemplate, usePipelineTriggerTemplateNames } from '../../utils/triggers';

import './TriggerTemplateSelector.scss';

type TriggerTemplateSelectorProps = {
  name: string;
  pipeline: PipelineKind;
  placeholder: string;
};

const TriggerTemplateSelector: React.FC<TriggerTemplateSelectorProps> = (props) => {
  const { t } = useTranslation();
  const { name, pipeline, placeholder } = props;
  const {
    metadata: { name: pipelineName, namespace },
  } = pipeline;

  const [field] = useField(name);
  const selection = field.value;

  const templateNames: RouteTemplate[] =
    usePipelineTriggerTemplateNames(pipelineName, namespace) || [];
  const items = templateNames.reduce(
    (acc, { triggerTemplateName }) => ({ ...acc, [triggerTemplateName]: triggerTemplateName }),
    {},
  );

  return (
    <div className="odc-trigger-template-selector">
      <DropdownField
        fullWidth
        disabled={templateNames.length === 0}
        items={items}
        name={name}
        title={placeholder}
      />
      {selection ? (
        <div className="co-break-word odc-trigger-template-selector__confirmationMessage">
          <Trans t={t} ns="pipelines-plugin">
            Are you sure you want to remove <b>{{ selection }}</b> from <b>{{ pipelineName }}</b>?
          </Trans>
        </div>
      ) : (
        <div className="odc-trigger-template-selector__pfModalHack" />
      )}
    </div>
  );
};

export default TriggerTemplateSelector;
