import React from 'react';

import { SafetyFirst } from './safety-first';

const seenGuide = 'seenGuide';

export class StartGuide extends SafetyFirst {
  constructor (props) {
    super(props);
    let visible = { props };
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
    localStorage.setItem(seenGuide, true);
  }

  render () {
    if (!this.state.visible) {
      return null;
    }
    return <div className="co-well">
      <button className="btn btn-link pull-right" onClick={() => this.dismiss()}>Dismiss</button>
      <h3 style={{marginBottom: 20}}>Tectonic Quick Start Guide</h3>

      <h4>1. Set up kubectl</h4>
      <p style={{marginBottom: 20}}>
        'kubectl' is a command-line program for interacting with the Kubernetes API.
        <br />
        <a href="https://coreos.com/tectonic/docs/latest/tutorials/first-app.html#configuring-credentials" target="_blank">
          <button className="btn btn-default" style={{marginTop: 10}}>
            Configure kubectl&nbsp;&nbsp;<i className="fa fa-external-link" />
          </button>
        </a>
      </p>

      <h4>2. Deploy an Application</h4>
      <p>
        You can choose to deploy your application with 'kubectl' or with Tectonic Console.
        <br />
        <a href="https://coreos.com/tectonic/docs/latest/tutorials/first-app.html#deploying-a-simple-application" target="_blank">
          <button className="btn btn-default" style={{marginTop: 10}}>
            Deploy Application&nbsp;&nbsp;<i className="fa fa-external-link" />
          </button>
        </a>
      </p>
      <hr />
      <h4>You may also be interested in</h4>
      <ul>
        <li>Grant and manage user access with Tectonic Identity. See <a href="https://coreos.com/tectonic/docs/latest/admin/user-management.html" target="_blank">User Management through Tectonic Identity <i className="fa fa-external-link" /></a>.</li>
        <li>Troubleshoot your Tectonic clusters. See <a href="https://coreos.com/tectonic/docs/latest/troubleshooting/troubleshooting.html" target="_blank">Troubleshooting Tectonic <i className="fa fa-external-link" /></a>.</li>
      </ul>
    </div>;
  }
}
