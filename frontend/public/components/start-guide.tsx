import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';

import { createProjectMessageStateToProps } from '../reducers/ui';
import { Disabled, HintBlock } from './utils';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '../const';
import { ProjectModel, RoleModel, StorageClassModel } from '../models';

const WHITELIST = [RoleModel.kind, StorageClassModel.kind];

export const StartGuide: React.FC<StartGuideProps> = ({startGuide}) => {
  return (
    <div className="co-m-pane__body">
      {startGuide}
    </div>
  );
};

export const OpenShiftGettingStarted = connect(createProjectMessageStateToProps)(
  ({createProjectMessage}) =>
    <HintBlock title="Getting Started">
      {createProjectMessage
        ? <p className="co-pre-line">{createProjectMessage}</p>
        : <p>
            OpenShift helps you quickly develop, host, and scale applications.
            To get started, create a project for your application.
        </p>
      }
      <p>
        <Link to="/k8s/cluster/projects">
          <Button variant="primary">View My Projects</Button>
        </Link>
      </p>
    </HintBlock>
);

export const withStartGuide = (WrappedComponent, doNotDisable: boolean = false) =>
  connectToFlags(FLAGS.SHOW_OPENSHIFT_START_GUIDE)(
    ({flags, ...rest}: any) => {
      const {kindObj} = rest;
      const kind = _.get(kindObj, 'kind', rest.kind);

      // The start guide does not need to be shown on the Projects list page.
      if (kind === ProjectModel.kind) {
        return <WrappedComponent {...rest} />;
      }

      if (flags.SHOW_OPENSHIFT_START_GUIDE) {
        return <React.Fragment>
          <StartGuide startGuide={<OpenShiftGettingStarted />} />
          {
            // Whitelist certain resource kinds that should not be disabled when no projects are available.
            // Disabling should also be optional
            doNotDisable || WHITELIST.includes(kind)
              ? <WrappedComponent {...rest} noProjectsAvailable />
              : <Disabled><WrappedComponent {...rest} noProjectsAvailable /></Disabled>
          }
        </React.Fragment>;
      }
      return <WrappedComponent {...rest} />;
    }
  );

type StartGuideProps = {
  startGuide: React.ReactNode;
};

export type WithStartGuideProps = {
  noProjectsAvailable?: boolean;
};
