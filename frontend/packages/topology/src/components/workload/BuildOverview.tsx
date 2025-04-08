import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatusIconAndText } from '@console/dynamic-plugin-sdk';
import { BuildLogLink, BuildNumberLink } from '@console/internal/components/build';
import { errorModal } from '@console/internal/components/modals/error-modal';
import {
  ResourceLink,
  resourcePath,
  SidebarSectionHeading,
  useAccessReview,
} from '@console/internal/components/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { BuildConfigModel } from '@console/internal/models';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { BuildPhase, startBuild } from '@console/internal/module/k8s/builds';
import { LogSnippet, Status, BuildConfigOverviewItem } from '@console/shared';

const MAX_VISIBLE = 3;

const StatusTitle = ({ build }: { build: K8sResourceKind }) => {
  const { t } = useTranslation();
  switch (build.status.phase) {
    case BuildPhase.Cancelled:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> was cancelled
        </Trans>
      );
    case BuildPhase.Complete:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> was complete
        </Trans>
      );
    case BuildPhase.Error:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> encountered an error
        </Trans>
      );
    case BuildPhase.Failed:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> failed
        </Trans>
      );
    case BuildPhase.New:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> is new
        </Trans>
      );
    case BuildPhase.Pending:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> is pending
        </Trans>
      );
    case BuildPhase.Running:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> is running
        </Trans>
      );
    default:
      return (
        <Trans t={t} ns="topology">
          Build <BuildNumberLink build={build} /> is {build.status?.phase?.toLowerCase()}
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

const BuildOverviewItem: React.FC<BuildOverviewListItemProps> = ({ build }) => {
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

const BuildOverviewList: React.FC<BuildOverviewListProps> = ({ buildConfig }) => {
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
          {builds.length > MAX_VISIBLE && (
            <div>
              <Link
                className="sidebar__section-view-all"
                to={`${resourcePath(referenceFor(buildConfig), name, namespace)}/builds`}
              >
                {t('topology~View all {{buildsLength}}', {
                  buildsLength: builds.length,
                })}
              </Link>
            </div>
          )}
          {canStartBuild && (
            <div>
              <Button variant="secondary" onClick={onClick} data-test-id="start-build-action">
                {t('topology~Start Build')}
              </Button>
            </div>
          )}
        </div>
      </li>
      {!(builds?.length > 0) ? (
        <li className="list-group-item">
          <span className="text-muted">{t('topology~No Builds found for this Build Config.')}</span>
        </li>
      ) : (
        builds
          .slice(0, MAX_VISIBLE)
          .map((build) => <BuildOverviewItem key={build.metadata.uid} build={build} />)
      )}
    </ul>
  );
};
export const BuildOverview: React.FC<BuildConfigsOverviewProps> = ({ buildConfigs }) => {
  const { t } = useTranslation();
  if (!(buildConfigs?.length > 0)) {
    return null;
  }
  return (
    <div className="build-overview">
      <SidebarSectionHeading text={t('topology~Builds')} />
      {buildConfigs.map((buildConfig) => (
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
  loaded?: boolean;
  loadError?: string;
};
