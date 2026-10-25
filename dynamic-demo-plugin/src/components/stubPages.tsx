import { useTranslation } from 'react-i18next';

export const DummyResourceListPage = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return <h1>{t('Example Resource List Page')}</h1>;
};

export const DummyResourceDetailsPage = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return <h1>{t('Example Resource Details Page')}</h1>;
};
