import type { FC } from 'react';
import { Form, FormGroup, Radio } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useShowOperandsInAllNamespaces } from './useShowOperandsInAllNamespaces';

export const ShowOperandsInAllNamespacesRadioGroup: FC = () => {
  const { t } = useTranslation('olm');
  const [
    showOperandsInAllNamespaces,
    setShowOperandsInAllNamespaces,
  ] = useShowOperandsInAllNamespaces();
  return (
    <Form isHorizontal>
      <FormGroup
        role="radiogroup"
        fieldId="show-operands"
        label={t('Show operands in:')}
        isInline
        hasNoPaddingTop
      >
        <Radio
          id="all-namespaces"
          name="show-operands"
          value="true"
          label={t('All namespaces')}
          onChange={() => setShowOperandsInAllNamespaces(true)}
          isChecked={showOperandsInAllNamespaces}
          data-checked-state={showOperandsInAllNamespaces}
        />
        <Radio
          id="current-namespace-only"
          name="show-operands"
          value="false"
          label={t('Current namespace only')}
          onChange={() => setShowOperandsInAllNamespaces(false)}
          isChecked={!showOperandsInAllNamespaces}
          data-checked-state={!showOperandsInAllNamespaces}
        />
      </FormGroup>
    </Form>
  );
};
