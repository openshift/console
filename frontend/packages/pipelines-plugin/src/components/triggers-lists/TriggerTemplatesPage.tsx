import { useTranslation } from 'react-i18next';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Title } from '@console/shared/src/components/title/Title';

const TriggerTemplatesPage = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Title>{t('pipelines-plugin~TriggerTemplates')}</Title>
      <DefaultPage {...props} />
    </>
  );
};

export default TriggerTemplatesPage;
