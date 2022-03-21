import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LinkifyExternal, Timestamp } from './utils';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { ClusterServiceVersionCondition, K8sResourceCondition } from '../module/k8s';

/**
 * Since ClusterServiceVersionCondition type is different from K8sResourceCondition, but InstallPlanCondition and SubscriptionCondition are identical, we will use the following enum to render the proper conditions table based on type.
 */
export enum ConditionTypes {
  ClusterServiceVersion = 'ClusterServiceVersion',
  K8sResource = 'K8sResource',
}

export const Conditions: React.FC<ConditionsProps> = ({
  conditions,
  type = ConditionTypes.K8sResource,
}) => {
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

  const rows = (conditions as Array<K8sResourceCondition | ClusterServiceVersionCondition>)?.map?.(
    (condition: K8sResourceCondition & ClusterServiceVersionCondition, i: number) => (
      <div
        className="row"
        data-test={type === ConditionTypes.ClusterServiceVersion ? condition.phase : condition.type}
        key={i}
      >
        {type === ConditionTypes.ClusterServiceVersion ? (
          <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${i}].phase`}>
            <CamelCaseWrap value={condition.phase} />
          </div>
        ) : (
          <>
            <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${i}].type`}>
              <CamelCaseWrap value={condition.type} />
            </div>
            <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${i}].status`}>
              {getStatusLabel(condition.status)}
            </div>
          </>
        )}
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
          <LinkifyExternal>{condition.message?.trim() || '-'}</LinkifyExternal>
        </div>
      </div>
    ),
  );

  return (
    <>
      {conditions?.length ? (
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            {type === ConditionTypes.ClusterServiceVersion ? (
              <div className="col-xs-4 col-sm-2 col-md-2">{t('public~Phase')}</div>
            ) : (
              <>
                <div className="col-xs-4 col-sm-2 col-md-2">{t('public~Type')}</div>
                <div className="col-xs-4 col-sm-2 col-md-2">{t('public~Status')}</div>
              </>
            )}
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
  conditions: K8sResourceCondition[] | ClusterServiceVersionCondition[];
  title?: string;
  subTitle?: string;
  type?: keyof typeof ConditionTypes;
};
