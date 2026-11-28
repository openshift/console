
import { useTranslation } from 'react-i18next';

// Function declarations so the module factory can initialize the exports
// before the shared module requires complete, regardless of evaluation order.
export function isLoading() {
  return false;
}

export function getError() {
  return null;
}

/* The value of a custom component to the Details dashboard-card on the Overview page.
 *  This component will be rendered as a child in the OverviewDetailItem CONSOLE component*/
export default function CustomOverviewDetailItem() {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return <>{t('Custom Overview Detail Info')}</>;
}

