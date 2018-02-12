import * as React from 'react';
import { Link } from 'react-router-dom';

/* eslint-disable react/jsx-no-target-blank */
export const DocumentationPage = () => <div>
  <div className="row co-m-nav-title">
    <div className="col-xs-12">
      <h1 className="co-m-page-title">Documentation</h1>
    </div>
  </div>
  <div className="co-m-pane">
    <div className="co-m-pane__body">
      <dl>
        <dt className="co-p-cluster__doc-title"><a href="https://coreos.com/tectonic/docs/latest/account/manage-account.html" target="_blank" rel="noopener">Manage Your Account</a></dt>
        <dd className="co-p-cluster__doc-description">You can manage your Tectonic account at <a href="https://account.coreos.com" target="_blank" rel="noopener">account.coreos.com</a> for access to licenses, billing details, invoices, and account users.</dd>
        <dt className="co-p-cluster__doc-title"><a href="https://coreos.com/tectonic/docs/latest/usage/" target="_blank" rel="noopener">End User Guide</a></dt>
        <dd className="co-p-cluster__doc-description">End-users of Tectonic are expected to deploy applications directly in Kubernetes. Your application&rsquo;s architecture will drive how you assemble these components together.</dd>
      </dl>
      <br />
      <h1>Additional Support</h1>
      <p><Link to="/start-guide"><span className="fa fa-fw fa-info-circle"></span>Quick Start Guide</Link></p>
      <p><a href="https://coreos.com/tectonic/docs/latest/" target="_blank" rel="noopener"><span className="fa fa-fw fa-book"></span>Full Documentation</a></p>
      <p><a href="https://github.com/coreos/tectonic-forum" target="_blank" rel="noopener noreferrer"><span className="fa fa-fw fa-comments-o"></span>Tectonic Forum</a></p>
    </div>
  </div>
</div>;
/* eslint-enable react/jsx-no-target-blank */
