import * as React from 'react';
import { Link } from 'react-router-dom';

import { SafetyFirst } from './safety-first';
import { DocumentationSidebar } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';

const seenGuide = 'seenGuide';

class StartGuide_ extends SafetyFirst {
  constructor (props) {
    super(props);
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
    const openshiftFlag = this.props.flags.OPENSHIFT;
    if (flagPending(openshiftFlag) || openshiftFlag || !this.state.visible) {
      return null;
    }
    /* eslint-disable react/jsx-no-target-blank */
    return <div className="co-well" id="tectonic-start-guide" style={this.props.style}>
      {this.state.dismissible && <button className="btn btn-link pull-right" onClick={() => this.dismiss()}>Dismiss</button>}
      <h1 style={{ marginTop: 0 }}>Tectonic Quick Start Guide</h1>

      <h2>1. Set up kubectl</h2>
      <p style={{marginBottom: 20}}>
        &apos;kubectl&apos; is a command-line program for interacting with the Kubernetes API.
        <br />
        <a href="https://coreos.com/tectonic/docs/latest/tutorials/kubernetes/configure-kubectl.html" target="_blank" rel="noopener">
          <button className="btn btn-info" style={{marginTop: 10}}>
            Configure kubectl&nbsp;&nbsp;<i className="fa fa-external-link" />
          </button>
        </a>
      </p>

      <h2>2. Deploy an Application</h2>
      <p>
        You can choose to deploy your application with &apos;kubectl&apos; or with Tectonic Console.
        <br />
        <a href="https://coreos.com/tectonic/docs/latest/tutorials/sandbox/first-app.html#deploying-a-simple-application" target="_blank" rel="noopener">
          <button className="btn btn-info" style={{marginTop: 10}}>
            Deploy Application&nbsp;&nbsp;<i className="fa fa-external-link" />
          </button>
        </a>
      </p>
      <hr />
      <h2>You may also be interested in</h2>
      <ul>
        <li>Grant and manage user access with Tectonic Identity. See <a href="https://coreos.com/tectonic/docs/latest/users/tectonic-identity-config.html" target="_blank" className="co-external-link" rel="noopener">User Management through Tectonic Identity</a></li>
        <li>Troubleshoot your Tectonic clusters. See <a href="https://coreos.com/tectonic/docs/latest/troubleshooting/troubleshooting.html" className="co-external-link" target="_blank" rel="noopener">Troubleshooting Tectonic</a></li>
      </ul>
    </div>;
    /* eslint-enable react/jsx-no-target-blank */
  }
}
export const StartGuide = connectToFlags(FLAGS.OPENSHIFT)(StartGuide_);

export const StartGuidePage = () => <div className="co-p-has-sidebar">
  <div className="co-p-has-sidebar__body">
    <StartGuide visible={true} dismissible={false} />
  </div>
  <DocumentationSidebar />
</div>;


export const OpenShiftGettingStarted = () => <div className="co-well">
  <h4>Getting Started</h4>
  <p>
    OpenShift helps you quickly develop, host, and scale applications. Create a project for your application.
  </p>
  <Link to="/k8s/cluster/projects">
    <button className="btn btn-info">View My Projects</button>
  </Link>
</div>;
