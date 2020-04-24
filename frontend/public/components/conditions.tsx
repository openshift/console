import * as React from 'react';

import { Timestamp } from './utils';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { K8sResourceCondition } from '../module/k8s';

export const Conditions: React.SFC<ConditionsProps> = ({ conditions }) => {
  const rows = (conditions || []).map((condition: K8sResourceCondition, i: number) => (
    <div className="row" data-test-id={condition.type} key={i}>
      <div className="col-xs-4 col-sm-2 col-md-2">
        <CamelCaseWrap value={condition.type} />
      </div>
      <div className="col-xs-4 col-sm-2 col-md-2" data-test-id="status">
        {condition.status}
      </div>
      <div className="hidden-xs hidden-sm col-md-2">
        <Timestamp timestamp={condition.lastTransitionTime} />
      </div>
      <div className="col-xs-4 col-sm-3 col-md-2">
        <CamelCaseWrap value={condition.reason} />
      </div>
      {/* remove initial newline which appears in route messages */}
      <div className="hidden-xs col-sm-5 col-md-4 co-break-word co-pre-line co-conditions__message">
        {condition.message?.trim() || '-'}
      </div>
    </div>
  ));

  return (
    <>
      {conditions?.length ? (
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-xs-4 col-sm-2 col-md-2">Type</div>
            <div className="col-xs-4 col-sm-2 col-md-2">Status</div>
            <div className="hidden-xs hidden-sm col-md-2">Updated</div>
            <div className="col-xs-4 col-sm-3 col-md-2">Reason</div>
            <div className="hidden-xs col-sm-5 col-md-4">Message</div>
          </div>
          <div className="co-m-table-grid__body">{rows}</div>
        </div>
      ) : (
        <div className="cos-status-box">
          <div className="text-center">No Conditions Found</div>
        </div>
      )}
    </>
  );
};

export type ConditionsProps = {
  conditions: K8sResourceCondition[];
  title?: string;
  subTitle?: string;
};
