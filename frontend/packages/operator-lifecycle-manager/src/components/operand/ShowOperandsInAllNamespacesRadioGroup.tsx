import * as React from 'react';
import { Form, FormGroup, Radio } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useShowOperandsInAllNamespaces } from './useShowOperandsInAllNamespaces';

export const ShowOperandsInAllNamespacesRadioGroup: React.FC = () => {
  const { t } = useTranslation();
  const [
    showOperandsInAllNamespaces,
    setShowOperandsInAllNamespaces,
  ] = useShowOperandsInAllNamespaces();
  return (
    <Form isHorizontal>
      <FormGroup
        role="radiogroup"
        fieldId="show-operands"
        label={t('olm~Show operands in:')}
        isInline
        hasNoPaddingTop
      >
        <Radio
          isChecked={showOperandsInAllNamespaces}
          name="show-operands"
          label={t('olm~All namespaces')}
          id="all-namespaces"
          value="true"
          onChange={() => setShowOperandsInAllNamespaces(true)}
        />
        <Radio
          isChecked={!showOperandsInAllNamespaces}
          name="show-operands"
          label={t('olm~Current namespace only')}
          id="current-namespace-only"
          value="false"
          onChange={() => setShowOperandsInAllNamespaces(false)}
        />
      </FormGroup>
    </Form>
  );
};
