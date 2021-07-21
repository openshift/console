import * as _ from 'lodash-es';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SyncAltIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { LogSnippet, Status, StatusIconAndText, BuildConfigOverviewItem } from '@console/shared';
import { BuildNumberLink, BuildLogLink } from '../build';
import { errorModal } from '../modals/error-modal';
import { fromNow } from '../utils/datetime';
import { K8sResourceKind } from '../../module/k8s';
import { BuildConfigModel } from '../../models';
import { BuildPhase, startBuild } from '../../module/k8s/builds';
import { ResourceLink, SidebarSectionHeading, useAccessReview } from '../utils';

const StatusTitle = ({ build }: { build: K8sResourceKind }) => {
  const { t } = useTranslation();
  switch (build.status.phase) {
    case BuildPhase.Cancelled:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> was cancelled
        </Trans>
      );
    case BuildPhase.Complete:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> was complete
        </Trans>
      );
    case BuildPhase.Error:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> encountered an error
        </Trans>
      );
    case BuildPhase.Failed:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> failed
        </Trans>
      );
    case BuildPhase.New:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> is new
        </Trans>
      );
    case BuildPhase.Pending:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> is pending
        </Trans>
      );
    case BuildPhase.Running:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> is running
        </Trans>
      );
    default:
      return (
        <Trans t={t} ns="public">
          Build <BuildNumberLink build={build} /> is {_.toLower(build.status.phase)}
        </Trans>
      );
  }
};

const BuildStatus = ({ build }: { build: K8sResourceKind }) => {
  const {
    status: { logSnippet, message, phase },
  } = build;
  const unsuccessful = [BuildPhase.Error, BuildPhase.Failed].includes(phase);
  return unsuccessful ? <LogSnippet message={message} logSnippet={logSnippet} /> : null;
};

const BuildOverviewItem: React.SFC<BuildOverviewListItemProps> = ({ build }) => {
  const {
    metadata: { creationTimestamp },
    status: { completionTimestamp, startTimestamp, phase },
  } = build;
  const lastUpdated = completionTimestamp || startTimestamp || creationTimestamp;
  return (
    <li className="list-group-item build-overview__item">
      <div className="build-overview__item-title">
        <div className="build-overview__status co-icon-and-text">
          <div className="co-icon-and-text__icon co-icon-flex-child">
            {phase === 'Running' ? (
              <StatusIconAndText icon={<SyncAltIcon />} title={phase} spin iconOnly />
            ) : (
              <Status status={phase} iconOnly />
            )}
          </div>
          <div>
            <StatusTitle build={build} />
            {lastUpdated && (
              <>
                {' '}
                <span className="build-overview__item-time text-muted">
                  ({fromNow(lastUpdated)})
                </span>
              </>
            )}
          </div>
        </div>
        <div>
          <BuildLogLink build={build} />
        </div>
      </div>
      <BuildStatus build={build} />
    </li>
  );
};

const BuildOverviewList: React.SFC<BuildOverviewListProps> = ({ buildConfig }) => {
  const {
    metadata: { name, namespace },
    builds,
  } = buildConfig;
  const { t } = useTranslation();

  const canStartBuild = useAccessReview({
    group: BuildConfigModel.apiGroup,
    resource: BuildConfigModel.plural,
    subresource: 'instantiate',
    name,
    namespace,
    verb: 'create',
  });
  const onClick = () => {
    startBuild(buildConfig).catch((err) => {
      const error = err.message;
      errorModal({ error });
    });
  };
  return (
    <ul className="list-group">
      <li className="list-group-item build-overview__item">
        <div className="build-overview__item-title">
          <div>
            <ResourceLink inline kind="BuildConfig" name={name} namespace={namespace} />
          </div>
          {canStartBuild && (
            <div>
              <Button variant="secondary" onClick={onClick}>
                {t('public~Start Build')}
              </Button>
            </div>
          )}
        </div>
      </li>
      {_.isEmpty(builds) ? (
        <li className="list-group-item">
          <span className="text-muted">{t('public~No Builds found for this Build Config.')}</span>
        </li>
      ) : (
        _.map(builds, (build) => <BuildOverviewItem key={build.metadata.uid} build={build} />)
      )}
    </ul>
  );
};
export const BuildOverview: React.SFC<BuildConfigsOverviewProps> = ({ buildConfigs }) => {
  const { t } = useTranslation();
  if (_.isEmpty(buildConfigs)) {
    return null;
  }
  return (
    <div className="build-overview">
      <SidebarSectionHeading text={t('public~Builds')} />
      {_.map(buildConfigs, (buildConfig) => (
        <BuildOverviewList key={buildConfig.metadata.uid} buildConfig={buildConfig} />
      ))}
    </div>
  );
};
type BuildOverviewListItemProps = {
  build: K8sResourceKind;
};
type BuildOverviewListProps = {
  buildConfig: BuildConfigOverviewItem;
};
type BuildConfigsOverviewProps = {
  buildConfigs: BuildConfigOverviewItem[];
};
