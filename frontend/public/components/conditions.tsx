import * as React from 'react';
import * as _ from 'lodash-es';

export const Conditions: React.SFC<ConditionsProps> = ({obj}) => {
  const conditions = _.get(obj, 'status.conditions');
  const rows = _.map(conditions, condition => <div className="row" key={condition.type}>
    <div className="col-xs-3 col-sm-2">
      {condition.type}
    </div>
    <div className="col-xs-3 col-sm-2">
      {condition.status}
    </div>
    <div className="col-xs-3 col-sm-3">
      {condition.reason}
    </div>
    <div className="col-xs-3 col-sm-5">
      {condition.message}
    </div>
  </div>);

  return <React.Fragment>
    <h1 className="co-section-title">Conditions</h1>
    {conditions
      ? <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-3 col-sm-2">Type</div>
          <div className="col-xs-3 col-sm-2">Status</div>
          <div className="col-xs-3 col-sm-3">Reason</div>
          <div className="col-xs-3 col-sm-5">Message</div>
        </div>
        <div className="co-m-table-grid__body">
          {rows}
        </div>
      </div>
      : <div className="cos-status-box">
        <div className="text-center">No Conditions Found</div>
      </div>}
  </React.Fragment>;
};

/* eslint-disable no-undef */
export type ConditionsProps = {
  obj: any,
};
/* eslint-enable no-undef */
