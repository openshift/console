import * as React from 'react';
import { useFormikContext } from 'formik';
import { Badge, Expandable } from '@patternfly/react-core';
import FormSection from '../../../import/section/FormSection';
import { TriggerBindingKind, TriggerBindingParam } from '../../resource-types';
import TriggerBindingSelector from './TriggerBindingSelector';
import { AddTriggerFormValues } from './types';

const TriggerBindingSection: React.FC = () => {
  const { setFieldValue } = useFormikContext<AddTriggerFormValues>();
  const [bindingVars, setBindingVars] = React.useState<TriggerBindingParam[]>(null);
  const updateTriggerBindingVariables = React.useCallback(
    (selectedTriggerBinding: TriggerBindingKind) => {
      setBindingVars(selectedTriggerBinding.spec.params);
      setFieldValue('triggerBinding.resource', selectedTriggerBinding);
    },
    [setFieldValue],
  );

  return (
    <div className="odc-add-trigger-form">
      <FormSection title="Webhook" fullWidth>
        <TriggerBindingSelector
          description="Select your git provider type to be associated with the Trigger"
          label="Git Provider Type"
          onChange={updateTriggerBindingVariables}
        />
        {bindingVars && (
          <Expandable toggleTextExpanded="Hide Variables" toggleTextCollapsed="Show Variables">
            <div className="odc-add-trigger-form__variable-container">
              <p className="odc-add-trigger-form__variable-descriptor">
                The following variables can be used in the Parameters or when created new Resources.
              </p>
              {bindingVars.map(({ name }) => (
                <Badge key={name} className="odc-add-trigger-form__variable-badge" isRead>
                  {name}
                </Badge>
              ))}
            </div>
          </Expandable>
        )}
      </FormSection>
    </div>
  );
};

export default TriggerBindingSection;
