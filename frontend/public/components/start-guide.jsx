import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { SafetyFirst } from './safety-first';
import { DocumentationSidebar } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { createProjectMessageStateToProps } from '../ui/ui-reducers';

const seenGuide = 'seenGuide';

class StartGuide_ extends SafetyFirst {
  constructor (props) {
    super(props);

    // TODO: The dismissable logic is not currently being used, but we'll
    // probably want a general start guide for OpenShift separate from the no
    // projects message. Leaving this for now.
    this.dismiss = this.dismiss.bind(this);
    let {dismissible, visible} = props;
    try {
      visible = visible || !localStorage.getItem(seenGuide);
    } catch (ignored) {
      // ignored
    }
    this.state = {
      dismissible,
      visible,
    };
  }

  dismiss () {
    this.setState({
      visible: false,
    });
    localStorage.setItem(seenGuide, true);
  }

  render () {
    const { OPENSHIFT: openshiftFlag, PROJECTS_AVAILABLE: projectsFlag } = this.props.flags;
    const { visible } = this.state;

    if (!visible || !openshiftFlag || projectsFlag || flagPending(projectsFlag)) {
      return null;
    }

    return <OpenShiftGettingStarted />;
  }
}
export const StartGuide = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE)(StartGuide_);

export const StartGuidePage = () => <div className="co-p-has-sidebar">
  <div className="co-p-has-sidebar__body">
    <StartGuide visible={true} dismissible={false} />
  </div>
  <DocumentationSidebar />
</div>;

const OpenShiftGettingStarted_ = ({createProjectMessage}) => <div className="co-well">
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
</div>;

export const OpenShiftGettingStarted = connect(createProjectMessageStateToProps)(OpenShiftGettingStarted_);
