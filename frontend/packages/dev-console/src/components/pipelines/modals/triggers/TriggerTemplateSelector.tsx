import * as React from 'react';
import { useField } from 'formik';
import { DropdownField } from '@console/shared/src';
import { Pipeline } from '../../../../utils/pipeline-augment';
import { RouteTemplate, usePipelineTriggerTemplateNames } from '../../utils/triggers';

import './TriggerTemplateSelector.scss';

type TriggerTemplateSelectorProps = {
  name: string;
  pipeline: Pipeline;
  placeholder: string;
};

const TriggerTemplateSelector: React.FC<TriggerTemplateSelectorProps> = (props) => {
  const { name, pipeline, placeholder } = props;

  const [field] = useField(name);
  const selection = field.value;

  const templateNames: RouteTemplate[] = usePipelineTriggerTemplateNames(pipeline) || [];
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
          Are you sure you want to remove <b>{selection}</b> from <b>{pipeline.metadata.name}</b>?
        </div>
      ) : (
        <div className="odc-trigger-template-selector__pfModalHack" />
      )}
    </div>
  );
};

export default TriggerTemplateSelector;
