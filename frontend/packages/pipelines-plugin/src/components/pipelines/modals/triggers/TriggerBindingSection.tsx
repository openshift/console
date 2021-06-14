import * as React from 'react';
import { Badge, ExpandableSection, FormHelperText } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { TriggerBindingKind, TriggerBindingParam } from '../../resource-types';
import { usePipelineOperatorVersion } from '../../utils/pipeline-operator';
import TriggerBindingSelector from './TriggerBindingSelector';
import { AddTriggerFormValues } from './types';

import './TriggerBindingSection.scss';

const TriggerBindingSection: React.FC = () => {
  const { t } = useTranslation();
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
      <FormSection title={t('pipelines-plugin~Webhook')} fullWidth>
        <TriggerBindingSelector
          description={t(
            'pipelines-plugin~Select your Git provider type to be associated with the Trigger',
          )}
          label={t('pipelines-plugin~Git Provider type')}
          onChange={updateTriggerBindingVariables}
        />
        {bindingVars && (
          <ExpandableSection
            toggleTextExpanded="Hide Variables"
            toggleTextCollapsed="Show Variables"
          >
            <div className="odc-trigger-binding-section__variable-container">
              <p className="odc-trigger-binding-section__variable-descriptor">
                {t(
                  'pipelines-plugin~The following variables can be used in the Parameters or when created new Resources.',
                )}
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
              {t('pipelines-plugin~Use this format when referencing variables in this form: ')}
              <code>{`$(${paramPrefix}parameter)`}</code>
            </FormHelperText>
          </ExpandableSection>
        )}
      </FormSection>
    </div>
  );
};

export default TriggerBindingSection;
