import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, ListGroup } from 'patternfly-react';

import { BuildPhaseIcon } from '../build';
import { errorModal } from '../modals/error-modal';
import { fromNow } from '../utils/datetime';
import { K8sResourceKind } from '../../module/k8s';
import { startBuild, getBuildNumber } from '../../module/k8s/builds';
import {
  ResourceLink,
  resourcePath,
  SidebarSectionHeading
} from '../utils';

import { BuildConfigOverviewItem } from '.';

const conjugateBuildPhase = (phase: string): string => {
  switch (phase) {
    case 'Cancelled':
      return 'was cancelled';
    case 'Error':
      return 'encountered an error';
    case 'Failed':
      return 'failed';
    default:
      return `is ${_.toLower(phase)}`;
  }
};

const BuildOverviewItem: React.SFC<BuildOverviewItemProps> = ({build}) => {
  const {metadata: {creationTimestamp, name, namespace}, status: {completionTimestamp, startTimestamp, phase}} = build;
  const latestUpdate = completionTimestamp
    || startTimestamp
    || creationTimestamp;

  return <li className="list-group-item build-config-overview__item">
    <div>
      <BuildPhaseIcon build={build} />
      &nbsp;
      Build
      &nbsp;
      <Link to={resourcePath('Build', name, namespace)}>
       #{getBuildNumber(build)}
      </Link>
      &nbsp;
      {conjugateBuildPhase(phase)}
      {latestUpdate && <span className="text-muted">&nbsp;({fromNow(latestUpdate)})</span>}
    </div>
    <div>
      <Link to={`${resourcePath('Build', name, namespace)}/logs`}>
        View Logs
      </Link>
    </div>
  </li>;
};

const BuildConfigOverviewList: React.SFC<BuildConfigOverviewListProps> = ({buildConfig}) => {
  const {metadata: {name, namespace}, builds} = buildConfig;
  const onClick = () => {
    startBuild(buildConfig).catch(err => {
      const error = err.message;
      errorModal({error});
    });
  };
  return <ListGroup className="build-config-overview__list" componentClass="ul">
    <li className="list-group-item build build-config-overview__item">
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
    </li>
    {
      _.isEmpty(builds)
        ? <li className="list-group-item"><span className="text-muted">No Builds found for this Build Config.</span></li>
        : _.map(builds, build => <BuildOverviewItem key={build.metadata.uid} build={build} />)
    }
  </ListGroup>;
};

export const BuildConfigsOverview: React.SFC<BuildConfigsOverviewProps> = ({buildConfigs}) => <div className="build-config-overview">
  <SidebarSectionHeading text="Builds" />
  {
    _.isEmpty(buildConfigs)
      ? <span className="text-muted">No Build Configs found for this resource.</span>
      : _.map(buildConfigs, buildConfig => <BuildConfigOverviewList key={buildConfig.metadata.uid} buildConfig={buildConfig} />)
  }
</div>;

/* eslint-disable no-unused-vars, no-undef */
type BuildOverviewItemProps = {
  build: K8sResourceKind;
};

type BuildConfigOverviewListProps = {
  buildConfig: BuildConfigOverviewItem;
};

type BuildConfigsOverviewProps = {
  buildConfigs: BuildConfigOverviewItem[];
};
/* eslint-enable no-unused-vars, no-undef */
