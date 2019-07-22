import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, ListGroup } from 'patternfly-react';

import { Status, StatusIconAndText } from '@console/shared';
import { BuildNumberLink, BuildLogLink } from '../build';
import { errorModal } from '../modals/error-modal';
import { fromNow } from '../utils/datetime';
import { K8sResourceKind } from '../../module/k8s';
import {
  BuildPhase,
  startBuild,
} from '../../module/k8s/builds';
import {
  ResourceLink,
  SidebarSectionHeading,
} from '../utils';

import { BuildConfigOverviewItem } from '.';
import { SyncAltIcon } from '@patternfly/react-icons';

const conjugateBuildPhase = (phase: BuildPhase): string => {
  switch (phase) {
    case BuildPhase.Cancelled:
      return 'was cancelled';
    case BuildPhase.Error:
      return 'encountered an error';
    case BuildPhase.Failed:
      return 'failed';
    default:
      return `is ${_.toLower(phase)}`;
  }
};

const BuildStatus = ({build}) => {
  const {status:{logSnippet, message, phase}} = build;
  const unsuccessful = [BuildPhase.Error, BuildPhase.Failed].includes(phase);
  return unsuccessful
    ? <div className="build-overview__item-reason">
      <p className="build-overview__status-message">{message}</p>
      {
        logSnippet && <pre className="build-overview__log-snippet">{logSnippet}</pre>
      }
    </div>
    : null;
};

const BuildOverviewItem: React.SFC<BuildOverviewListItemProps> = ({build}) => {
  const {metadata: {creationTimestamp}, status: {completionTimestamp, startTimestamp, phase}} = build;
  const lastUpdated = completionTimestamp
    || startTimestamp
    || creationTimestamp;

  const statusTitle = (
    <>
      Build
      &nbsp;
      <BuildNumberLink build={build} />
      &nbsp;
      {conjugateBuildPhase(phase)}
      {lastUpdated && <span className="text-muted">&nbsp;({fromNow(lastUpdated)})</span>}
    </>
  );

  return <li className="list-group-item build-overview__item">
    <div className="build-overview__item-title">
      <div className="build-overview__status co-icon-and-text">
        <div className="co-icon-and-text__icon co-icon-flex-child">
          {phase === 'Running'
            ? <StatusIconAndText icon={<SyncAltIcon />} title={phase} spin iconOnly />
            : <Status status={phase} iconOnly />}
        </div>
        {statusTitle}
      </div>
      <div>
        <BuildLogLink build={build} />
      </div>
    </div>
    <BuildStatus build={build} />
  </li>;
};

const BuildOverviewList: React.SFC<BuildOverviewListProps> = ({buildConfig}) => {
  const {metadata: {name, namespace}, builds} = buildConfig;
  const onClick = () => {
    startBuild(buildConfig).catch(err => {
      const error = err.message;
      errorModal({error});
    });
  };
  return <ListGroup className="build-overview__list" componentClass="ul">
    <li className="list-group-item build-overview__item">
      <div className="build-overview__item-title">
        <div>
          <ResourceLink
            inline
            kind="BuildConfig"
            name={name}
            namespace={namespace}
          />
        </div>
        <div>
          <Button bsStyle="default" bsSize="xs" onClick={onClick}>Start Build</Button>
        </div>
      </div>
    </li>
    {
      _.isEmpty(builds)
        ? <li className="list-group-item"><span className="text-muted">No Builds found for this Build Config.</span></li>
        : _.map(builds, build => <BuildOverviewItem key={build.metadata.uid} build={build} />)
    }
  </ListGroup>;
};

export const BuildOverview: React.SFC<BuildConfigsOverviewProps> = ({buildConfigs}) => <div className="build-overview">
  <SidebarSectionHeading text="Builds" />
  {
    _.isEmpty(buildConfigs)
      ? <span className="text-muted">No Build Configs found for this resource.</span>
      : _.map(buildConfigs, buildConfig => <BuildOverviewList key={buildConfig.metadata.uid} buildConfig={buildConfig} />)
  }
</div>;

type BuildOverviewListItemProps = {
  build: K8sResourceKind;
};

type BuildOverviewListProps = {
  buildConfig: BuildConfigOverviewItem;
};

type BuildConfigsOverviewProps = {
  buildConfigs: BuildConfigOverviewItem[];
};
