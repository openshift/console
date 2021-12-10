import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FirehoseResourcesResult } from '@console/internal/components/utils';
import { GetOperatorsWithStatuses, LazyLoader, OperatorRowProps } from '@console/plugin-sdk';
import { getMostImportantStatuses } from './state-utils';
import { HealthState } from './states';
import StatusItem, { StatusPopupSection } from './StatusPopup';

import './operator-body.scss';

export const OperatorsSection: React.FC<OperatorsSectionProps> = ({
  resources,
  getOperatorsWithStatuses,
  title,
  linkTo,
  Row,
  Component,
  isResolved,
}) => {
  const { t } = useTranslation();
  const error = _.values(resources).some((r) => r.loadError);
  const operatorStatuses = getOperatorsWithStatuses(resources);
  const sortedOperatorStatuses = getMostImportantStatuses(operatorStatuses).sort((a, b) =>
    a.operators[0].metadata.name.localeCompare(b.operators[0].metadata.name),
  );
  const operatorsHealthy = sortedOperatorStatuses.every((o) => o.status.health === HealthState.OK);
  const RowLoading = React.useCallback(() => <div className="co-status__operator-skeleton" />, []);
  return (
    <StatusPopupSection
      firstColumn={
        <>
          <span>{title}</span>
          <span className="text-secondary co-status__operator-detail">
            {' '}
            {t('console-shared~({{operatorStatusLength}} installed)', {
              operatorStatusLength: operatorStatuses.length,
            })}
          </span>
        </>
      }
      secondColumn={t('console-shared~Status')}
    >
      {error ? (
        <div className="text-secondary">{t('console-shared~Not available')}</div>
      ) : (
        !operatorsHealthy &&
        sortedOperatorStatuses.map((operatorStatus) => (
          <Row
            key={operatorStatus.operators[0].metadata.uid}
            Component={Component}
            operatorStatus={operatorStatus}
            LoadingComponent={RowLoading}
            isResolved={isResolved}
          />
        ))
      )}
      <StatusItem
        value={t('console-shared~All {{status}}', {
          status: operatorStatuses[0].status.title.toLowerCase(),
        })}
        icon={operatorStatuses[0].status.icon}
      >
        <Link to={linkTo}>{t('console-shared~View all')}</Link>
      </StatusItem>
    </StatusPopupSection>
  );
};

type OperatorsSectionProps = {
  resources: FirehoseResourcesResult;
  getOperatorsWithStatuses: GetOperatorsWithStatuses;
  title: string;
  linkTo: string;
  Row: React.ComponentType<
    OperatorRowProps & {
      LoadingComponent: () => JSX.Element;
      Component: React.ComponentType<OperatorRowProps> | LazyLoader<OperatorRowProps>;
      key: string;
      isResolved: boolean;
    }
  >;
  isResolved: boolean;
  Component: React.ComponentType<OperatorRowProps> | LazyLoader<OperatorRowProps>;
};
