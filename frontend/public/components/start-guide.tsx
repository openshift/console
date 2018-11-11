import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { createProjectMessageStateToProps } from '../ui/ui-reducers';
import { SafetyFirst } from './safety-first';
import { DocumentationSidebar, Disabled } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { ProjectModel, RoleModel, StorageClassModel } from '../models';

const WHITELIST = [RoleModel.kind, StorageClassModel.kind];

const seenGuide: string = 'seenGuide';

export class StartGuide extends SafetyFirst<StartGuideProps, StartGuideState> {
  constructor (props) {
    super(props);

    // TODO: The dismissable logic is not currently being used, but we'll
    // probably want a general start guide for OpenShift separate from the no
    // projects message. Leaving this for now.
    this.dismiss = this.dismiss.bind(this);
    let {visible} = props;
    try {
      visible = visible || !localStorage.getItem(seenGuide);
    } catch (ignored) {
      // ignored
    }
    this.state = {
      visible,
    };
  }

  dismiss () {
    this.setState({
      visible: false,
    });
    localStorage.setItem(seenGuide, 'true');
  }

  render () {
    const { visible } = this.state;
    return visible ? <OpenShiftGettingStarted /> : null;
  }
}

export const StartGuidePage = () => <div className="co-p-has-sidebar">
  <div className="co-p-has-sidebar__body">
    <StartGuide visible />
  </div>
  <DocumentationSidebar />
</div>;

export const OpenShiftGettingStarted = connect(createProjectMessageStateToProps)(
  ({createProjectMessage}) =>
    <div className="co-well">
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
    </div>
);

export const withStartGuide = (WrappedComponent, doNotDisable: boolean = false) =>
  connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE)(
    ({flags, ...rest}: any) => {
      const {kindObj} = rest;
      const kind = _.get(kindObj, 'kind', rest.kind);

      // The start guide does not need to be shown on the Projects list page.
      if (kind === ProjectModel.kind) {
        return <WrappedComponent {...rest} />;
      }

      if (flagPending(flags.OPENSHIFT) || flagPending(flags)) {
        return null;
      }

      if (flags.OPENSHIFT && !flags.PROJECTS_AVAILABLE) {
        return <React.Fragment>
          <StartGuide />
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
  dismissible?: boolean;
  visible?: boolean;
};

type StartGuideState = {
  visible: boolean;
};

export type WithStartGuideProps = {
  noProjectsAvailable?: boolean;
};
/* eslint-enable no-unused-vars, no-undef */
