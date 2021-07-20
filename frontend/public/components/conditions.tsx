import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from './utils';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { K8sResourceCondition } from '../module/k8s';

export const Conditions: React.FC<ConditionsProps> = ({ conditions }) => {
  const { t } = useTranslation();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'True':
        return t('public~True');
      case 'False':
        return t('public~False');
      default:
        return status;
    }
  };

  const rows = conditions?.map?.((condition: K8sResourceCondition, i: number) => (
    <div className="row" data-test={condition.type} key={i}>
      <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${i}].type`}>
        <CamelCaseWrap value={condition.type} />
      </div>
      <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${i}].status`}>
        {getStatusLabel(condition.status)}
      </div>
      <div
        className="hidden-xs hidden-sm col-md-2"
        data-test={`condition[${i}].lastTransitionTime`}
      >
        <Timestamp timestamp={condition.lastTransitionTime} />
      </div>
      <div className="col-xs-4 col-sm-3 col-md-2" data-test={`condition[${i}].reason`}>
        <CamelCaseWrap value={condition.reason} />
      </div>
      {/* remove initial newline which appears in route messages */}
      <div
        className="hidden-xs col-sm-5 col-md-4 co-break-word co-pre-line co-conditions__message"
        data-test={`condition[${i}].message`}
      >
        {condition.message?.trim() || '-'}
      </div>
    </div>
  ));

  return (
    <>
      {conditions?.length ? (
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-xs-4 col-sm-2 col-md-2">{t('public~Type')}</div>
            <div className="col-xs-4 col-sm-2 col-md-2">{t('public~Status')}</div>
            <div className="hidden-xs hidden-sm col-md-2">{t('public~Updated')}</div>
            <div className="col-xs-4 col-sm-3 col-md-2">{t('public~Reason')}</div>
            <div className="hidden-xs col-sm-5 col-md-4">{t('public~Message')}</div>
          </div>
          <div className="co-m-table-grid__body">{rows}</div>
        </div>
      ) : (
        <div className="cos-status-box">
          <div className="pf-u-text-align-center">{t('public~No conditions found')}</div>
        </div>
      )}
    </>
  );
};
Conditions.displayName = 'Conditions';

export type ConditionsProps = {
  conditions: K8sResourceCondition[];
  title?: string;
  subTitle?: string;
};
