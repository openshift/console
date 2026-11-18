import type { GetDataViewCell, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { getPixaaPodColor } from './pixaa-pods';

const PixaaPodCell = ({ name }: { name?: string }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const color = getPixaaPodColor(name);

  if (!color) {
    return <>{t('No')}</>;
  }

  return (
    <span>
      <span
        aria-hidden="true"
        style={{
          backgroundColor: color,
          border: '1px solid currentColor',
          display: 'inline-block',
          height: '1em',
          marginInlineEnd: '0.375em',
          verticalAlign: 'middle',
          width: '1em',
        }}
      />
      {t('Yes')} ({color})
    </span>
  );
};

export const getPixaaPodCells: GetDataViewCell<K8sResourceCommon> = (rows) =>
  rows.map(({ obj }) => ({ cell: <PixaaPodCell name={obj.metadata.name} /> }));
