import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Label as PfLabel, LabelGroup as PfLabelGroup } from '@patternfly/react-core';

const Label = ({ k, v }) => (
  <PfLabel className="co-label" key={k}>
    <span className="co-label__key">{k}</span>
    <span className="co-label__eq">=</span>
    <span className="co-label__value">{v}</span>
  </PfLabel>
);

export const Labels = ({ kind, labels }) => {
  const { t } = useTranslation();

  return _.isEmpty(labels) ? (
    <div className="text-muted">{t('public~No labels')}</div>
  ) : (
    <div className={`co-text-${kind}`}>
      <PfLabelGroup className="co-label-group" numLabels={20}>
        {_.map(labels, (v, k) => (
          <Label key={k} k={k} v={v} />
        ))}
      </PfLabelGroup>
    </div>
  );
};
