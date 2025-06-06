import { useTranslation } from 'react-i18next';
import { NSDropdownField } from '@console/shared/src';

const NamespaceSection = () => {
  const { t } = useTranslation();
  return (
    <div className="pf-v6-c-form co-m-pane__form">
      <NSDropdownField
        name="project.name"
        label={t('devconsole~Select project')}
        fullWidth={false}
        required
      />
    </div>
  );
};

export default NamespaceSection;
