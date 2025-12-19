import { FormSection, TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';

const AdminNamespaceSection: Snail.FCC = () => {
  const { t } = useTranslation();

  return (
    <FormSection data-test="admin-namespace-section">
      <InputField
        type={TextInputTypes.text}
        name="namespace"
        label={t('webterminal-plugin~Project')}
        helpText={t(
          'webterminal-plugin~This Project will be used to initialize your command line terminal',
        )}
        isDisabled
        required
      />
    </FormSection>
  );
};

export default AdminNamespaceSection;
