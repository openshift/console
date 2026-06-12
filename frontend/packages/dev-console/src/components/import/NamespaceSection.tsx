import { useTranslation } from 'react-i18next';
import { NSDropdownField } from '@console/shared/src/components/formik-fields/NSDropdownField';

const NamespaceSection = () => {
  const { t } = useTranslation('devconsole');
  return (
    <div className="pf-v6-c-form co-m-pane__form">
      <NSDropdownField name="project.name" label={t('Select project')} fullWidth={false} required />
    </div>
  );
};

export default NamespaceSection;
