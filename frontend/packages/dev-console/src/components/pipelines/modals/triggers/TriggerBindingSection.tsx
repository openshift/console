import * as React from 'react';
import { useFormikContext } from 'formik';
import { Badge, ExpandableSection, FormHelperText } from '@patternfly/react-core';
import FormSection from '../../../import/section/FormSection';
import { usePipelineOperatorVersion } from '../../utils/pipeline-operator';
import { TriggerBindingKind, TriggerBindingParam } from '../../resource-types';
import TriggerBindingSelector from './TriggerBindingSelector';
import { AddTriggerFormValues } from './types';

import './TriggerBindingSection.scss';

const TriggerBindingSection: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<AddTriggerFormValues>();
  const [bindingVars, setBindingVars] = React.useState<TriggerBindingParam[]>(null);

  // Starting with Pipeline Operator 1.1 (Tekton Triggers 0.6) we should use a new param name.
  const pipelineOperatorVersion = usePipelineOperatorVersion(values.namespace);
  const paramPrefix =
    pipelineOperatorVersion?.major === 0 ||
    (pipelineOperatorVersion?.major === 1 && pipelineOperatorVersion?.minor === 0)
      ? 'params.'
      : 'tt.params.';

  const updateTriggerBindingVariables = React.useCallback(
    (selectedTriggerBinding: TriggerBindingKind) => {
      setBindingVars(selectedTriggerBinding.spec.params);
      setFieldValue('triggerBinding.resource', selectedTriggerBinding);
    },
    [setFieldValue],
  );

  return (
    <div className="odc-trigger-binding-section">
      <FormSection title="Webhook" fullWidth>
        <TriggerBindingSelector
          description="Select your Git provider type to be associated with the Trigger"
          label="Git Provider Type"
          onChange={updateTriggerBindingVariables}
        />
        {bindingVars && (
          <ExpandableSection
            toggleTextExpanded="Hide Variables"
            toggleTextCollapsed="Show Variables"
          >
            <div className="odc-trigger-binding-section__variable-container">
              <p className="odc-trigger-binding-section__variable-descriptor">
                The following variables can be used in the Parameters or when created new Resources.
              </p>
              {bindingVars.map(({ name }) => (
                <Badge key={name} className="odc-trigger-binding-section__variable-badge" isRead>
                  {name}
                </Badge>
              ))}
            </div>
            <FormHelperText
              isHidden={false}
              className="odc-trigger-binding-section__variable-help-text"
            >
              Use this format when referencing variables in this form:{' '}
              <code>{`$(${paramPrefix}parameter)`}</code>
            </FormHelperText>
          </ExpandableSection>
        )}
      </FormSection>
    </div>
  );
};

export default TriggerBindingSection;
