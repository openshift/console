import * as React from 'react';

import { SafetyFirst } from './safety-first';
import { DocumentationSidebar } from './utils';

const seenGuide = 'seenGuide';

export class StartGuide extends SafetyFirst {
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
    if (!this.state.visible) {
      return null;
    }
    /* eslint-disable react/jsx-no-target-blank */
    return <div className="co-well" id="tectonic-start-guide" style={this.props.style}>
      {this.state.dismissible && <button className="btn btn-link pull-right" onClick={() => this.dismiss()}>Dismiss</button>}
      <h3 style={{marginBottom: 20}}>Tectonic Quick Start Guide</h3>

      <h4>1. Set up kubectl</h4>
      <p style={{marginBottom: 20}}>
        &apos;kubectl&apos; is a command-line program for interacting with the Kubernetes API.
        <br />
        <a href="https://coreos.com/tectonic/docs/latest/tutorials/kubernetes/configure-kubectl.html" target="_blank" rel="noopener">
          <button className="btn btn-info" style={{marginTop: 10}}>
            Configure kubectl&nbsp;&nbsp;<i className="fa fa-external-link" />
          </button>
        </a>
      </p>

      <h4>2. Deploy an Application</h4>
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
      <h4>You may also be interested in</h4>
      <ul>
        <li>Grant and manage user access with Tectonic Identity. See <a href="https://coreos.com/tectonic/docs/latest/users/tectonic-identity-config.html" target="_blank" rel="noopener">User Management through Tectonic Identity <i className="fa fa-external-link" /></a>.</li>
        <li>Troubleshoot your Tectonic clusters. See <a href="https://coreos.com/tectonic/docs/latest/troubleshooting/troubleshooting.html" target="_blank" rel="noopener">Troubleshooting Tectonic <i className="fa fa-external-link" /></a>.</li>
      </ul>
    </div>;
    /* eslint-enable react/jsx-no-target-blank */
  }
}

export const StartGuidePage = () => <div className="co-p-cluster">
  <div className="co-p-cluster__body">
    <StartGuide visible={true} dismissible={false} />
  </div>
  <DocumentationSidebar />
</div>;
