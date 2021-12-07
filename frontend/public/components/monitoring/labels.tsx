import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const Label = ({ k, v }) => (
  <div className="co-m-label co-m-label--expand" key={k}>
    <span className="co-m-label__key">{k}</span>
    <span className="co-m-label__eq">=</span>
    <span className="co-m-label__value">{v}</span>
  </div>
);

export const Labels = ({ kind, labels }) => {
  const { t } = useTranslation();

  return _.isEmpty(labels) ? (
    <div className="text-muted">{t('public~No labels')}</div>
  ) : (
    <div className={`co-text-${kind}`}>
      {_.map(labels, (v, k) => (
        <Label key={k} k={k} v={v} />
      ))}
    </div>
  );
};
