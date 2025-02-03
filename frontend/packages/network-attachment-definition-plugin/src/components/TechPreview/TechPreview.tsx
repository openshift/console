import * as React from 'react';
import classNames from 'classnames';
import './TechPreview.scss';
import { useTranslation } from 'react-i18next';

const TechPreview: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={classNames('pf-v6-c-button', 'kv-tech-preview-label')}>
      {t('network-attachment-definition-plugin~Tech preview')}
    </div>
  );
};

export default TechPreview;
