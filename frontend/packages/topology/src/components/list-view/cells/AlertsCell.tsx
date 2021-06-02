import * as React from 'react';
import { DataListCell, Tooltip } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Status as TooltipStatus,
  useBuildConfigsWatcher,
  getBuildAlerts,
  getResourcePausedAlert,
  usePodsWatcher,
  useReplicationControllersWatcher,
  getReplicationControllerAlerts,
  useIsMobile,
} from '@console/shared';
import { getResource } from '../../../utils';

import './AlertsCell.scss';

type AlertsProps = {
  item: Node;
};

const AlertTooltip = ({ alerts, severity, isMobile }) => {
  if (!alerts) {
    return null;
  }

  const count = alerts.length;
  const message = _.uniq(alerts.map((a) => a.message)).join('\n');

  const status = (
    <span className="odc-topology-list-view__alert-cell--status">
      <TooltipStatus status={severity} title={String(count)} />
    </span>
  );

  // No tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  if (isMobile) {
    return status;
  }

  const tipContent = [
    <span key="message" className="co-pre-wrap">
      {message}
    </span>,
  ];
  return (
    <Tooltip content={tipContent} distance={10}>
      {status}
    </Tooltip>
  );
};

const AlertsCell: React.FC<AlertsProps> = ({ item }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const resource = getResource(item);
  const { podData, loaded } = usePodsWatcher(resource);
  const { buildConfigs, loaded: buildConfigsLoaded } = useBuildConfigsWatcher(resource);
  const { loaded: rcsLoaded, mostRecentRC } = useReplicationControllersWatcher(resource);

  const currentAlerts = React.useMemo(() => {
    if (loaded && podData.current) {
      return podData.current.alerts;
    }
    return {};
  }, [loaded, podData]);

  const previousAlerts = React.useMemo(() => {
    if (loaded && podData.previous) {
      return podData.current.alerts;
    }
    return {};
  }, [loaded, podData]);

  const buildConfigAlerts = React.useMemo(() => {
    if (buildConfigsLoaded && buildConfigs) {
      return getBuildAlerts(buildConfigs);
    }
    return {};
  }, [buildConfigsLoaded, buildConfigs]);

  const rollOutAlerts = React.useMemo(() => {
    if (rcsLoaded && mostRecentRC) {
      return getReplicationControllerAlerts(mostRecentRC);
    }
    return {};
  }, [mostRecentRC, rcsLoaded]);

  const alerts = {
    ...getResourcePausedAlert(resource),
    ...rollOutAlerts,
    ...buildConfigAlerts,
    ...currentAlerts,
    ...previousAlerts,
  };

  if (alerts?.length) {
    return null;
  }

  const {
    error,
    warning,
    info,
    buildNew,
    buildPending,
    buildRunning,
    buildFailed,
    buildError,
  } = _.groupBy(alerts, 'severity');
  return (
    <DataListCell id={`${item.getId()}_alerts`}>
      <div className="odc-topology-list-view__alert-cell">
        {(error || warning || info) && (
          <div className="odc-topology-list-view__alert-cell__status">
            <span className="odc-topology-list-view__alert-cell__label">
              {t('topology~Alerts:')}
            </span>
            <AlertTooltip severity="Error" alerts={error} isMobile={isMobile} />
            <AlertTooltip severity="Warning" alerts={warning} isMobile={isMobile} />
            <AlertTooltip severity="Info" alerts={info} isMobile={isMobile} />
          </div>
        )}
        {(buildNew || buildPending || buildRunning || buildFailed || buildError) && (
          <div className="odc-topology-list-view__alert-cell__status">
            <span className="odc-topology-list-view__alert-cell__label">
              {t('topology~Builds:')}
            </span>
            <AlertTooltip severity="New" alerts={buildNew} isMobile={isMobile} />
            <AlertTooltip severity="Pending" alerts={buildPending} isMobile={isMobile} />
            <AlertTooltip severity="Running" alerts={buildRunning} isMobile={isMobile} />
            <AlertTooltip severity="Failed" alerts={buildFailed} isMobile={isMobile} />
            <AlertTooltip severity="Error" alerts={buildError} isMobile={isMobile} />
          </div>
        )}
      </div>
    </DataListCell>
  );
};

export default AlertsCell;
