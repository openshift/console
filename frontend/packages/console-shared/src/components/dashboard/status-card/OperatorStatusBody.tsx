import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { GetOperatorsWithStatuses, LazyLoader } from '@console/plugin-sdk';
import { AsyncComponent, FirehoseResourcesResult } from '@console/internal/components/utils';
import { HealthState } from './states';
import { getMostImportantStatuses } from './state-utils';

import './operator-body.scss';

export const OperatorsSection: React.FC<OperatorsSectionProps> = ({
  resources,
  getOperatorsWithStatuses,
  title,
  linkTo,
  rowLoader,
}) => {
  const error = _.values(resources).some((r) => r.loadError);
  const operatorStatuses = getOperatorsWithStatuses(resources);
  const sortedOperatorStatuses = getMostImportantStatuses(operatorStatuses).sort((a, b) =>
    a.operators[0].metadata.name.localeCompare(b.operators[0].metadata.name),
  );
  const operatorsHealthy = sortedOperatorStatuses.every((o) => o.status.health === HealthState.OK);
  const RowLoading = React.useCallback(() => <div className="co-status__operator-skeleton" />, []);
  return (
    <div className="co-status__operator-section">
      <div className="co-status__operator-row">
        <div>
          <span className="co-status__operator-text--bold">{title}</span>
          <span className="text-secondary">{` (${operatorStatuses.length} installed)`}</span>
        </div>
        <div className="text-secondary">Status</div>
      </div>
      {error ? (
        <div className="text-secondary">Not Available</div>
      ) : (
        !operatorsHealthy &&
        sortedOperatorStatuses.map((operatorStatus) => (
          <AsyncComponent
            key={operatorStatus.operators[0].metadata.uid}
            operatorStatus={operatorStatus}
            loader={rowLoader}
            LoadingComponent={RowLoading}
          />
        ))
      )}
      <div className="co-status__operator-row">
        <Link to={linkTo}>View all</Link>
        {!error && operatorsHealthy && operatorStatuses.length && (
          <div className="co-status__operator">
            <div className="text-secondary">
              All {operatorStatuses[0].status.title.toLowerCase()}
            </div>
            <div className="co-status__operator-icon">{operatorStatuses[0].status.icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const OperatorStatusRow: React.FC<OperatorStatusRowProps> = ({ title, icon, children }) => (
  <div className="co-status__operator-row">
    {children}
    <div className="co-status__operator">
      <div className="text-secondary">{title}</div>
      <div className="co-status__operator-icon">{icon}</div>
    </div>
  </div>
);

const OperatorStatusBody: React.FC = ({ children }) => (
  <>
    <div className="co-status__operator-section">
      Operators create, configure, and manage applications by extending the Kubernetes API.
    </div>
    {children}
  </>
);

export default OperatorStatusBody;

type OperatorStatusRowProps = {
  title: string;
  icon: React.ReactNode;
};

type OperatorsSectionProps = {
  resources: FirehoseResourcesResult;
  getOperatorsWithStatuses: GetOperatorsWithStatuses;
  title: string;
  linkTo: string;
  rowLoader: LazyLoader;
};
