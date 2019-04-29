import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from 'patternfly-react';

import { createProjectMessageStateToProps } from '../ui/ui-reducers';
import { DocumentationSidebar, Disabled } from './utils';
import { FLAGS, connectToFlags } from '../features';
import { ProjectModel, RoleModel, StorageClassModel } from '../models';

const WHITELIST = [RoleModel.kind, StorageClassModel.kind];

export const StartGuide: React.FC<StartGuideProps> = (props) => {
  const {dismissKey, startGuide} = props;
  let visible;
  try {
    visible = !dismissKey || !localStorage.getItem(dismissKey);
  } catch (ignored) {
    // ignored
  }
  const [isVisible, setIsVisible] = React.useState(visible);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(dismissKey, 'true');
  };

  return isVisible
    ? <div className="co-well">
      {dismissKey && <Button className="co-well__close-button" aria-label="Close" bsStyle="link" onClick={dismiss}><i className="pficon pficon-close" aria-hidden="true" /></Button>}
      {startGuide}
    </div>
    : null;
};

export const StartGuidePage = () => <div className="co-p-has-sidebar">
  <div className="co-p-has-sidebar__body">
    <StartGuide startGuide={<OpenShiftGettingStarted />} />
  </div>
  <DocumentationSidebar />
</div>;

export const OpenShiftGettingStarted = connect(createProjectMessageStateToProps)(
  ({createProjectMessage}) =>
    <React.Fragment>
      <h4>Getting Started</h4>
      { createProjectMessage
        ? <p className="co-pre-line">{createProjectMessage}</p>
        : <p>
            OpenShift helps you quickly develop, host, and scale applications.
            To get started, create a project for your application.
        </p>
      }
      <Link to="/k8s/cluster/projects">
        <button className="btn btn-info">View My Projects</button>
      </Link>
    </React.Fragment>
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

/* eslint-disable no-unused-vars, no-undef */
type StartGuideProps = {
  dismissKey?: string;
  startGuide: React.ReactNode;
};

export type WithStartGuideProps = {
  noProjectsAvailable?: boolean;
};
/* eslint-enable no-unused-vars, no-undef */
