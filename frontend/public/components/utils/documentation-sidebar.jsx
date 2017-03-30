import React from 'react';

export const DocumentationSidebar = ({version}) => <div className="co-p-cluster__sidebar">
  <div className="co-m-pane__body">
    <h1 className="co-p-cluster__sidebar-heading co-p-cluster__sidebar-heading--first">Documentation</h1>
    <dl>
      <dt className="co-p-cluster__doc-title"><a href="https://coreos.com/tectonic/docs/latest/account/" target="_blank">Manage Your Account</a></dt>
      <dd className="co-p-cluster__doc-description">You can manage your Tectonic account at <a href="https://account.coreos.com" target="_blank">account.coreos.com</a> for access to licenses, billing details, invoices, and account users.</dd>
      <dt className="co-p-cluster__doc-title"><a href="https://coreos.com/tectonic/docs/latest/usage/" target="_blank">End User Guide</a></dt>
      <dd className="co-p-cluster__doc-description">End-users of Tectonic are expected to deploy applications directly in Kubernetes. Your application's architecture will drive how you assemble these components together.</dd>
    </dl>
    <h1 className="co-p-cluster__sidebar-heading">Additional Support</h1>
    <p><a href="https://coreos.com/tectonic/docs/latest/" target="_blank" className="co-p-cluster__sidebar-link"><span className="fa fa-book co-p-cluster__sidebar-link-icon"></span>Full Documentation</a></p>
    { version && version.entitlementKind === 'nodes' && <p><a href="https://github.com/coreos/tectonic-forum" target="_blank" className="co-p-cluster__sidebar-link"><span className="fa fa-comments-o co-p-cluster__sidebar-link-icon"></span>Tectonic Forum</a></p> }
    { version && version.entitlementKind === 'nodes' && <p><a href="mailto:tectonic-feedback@coreos.com" className="co-p-cluster__sidebar-link"><span className="fa fa-envelope-o co-p-cluster__sidebar-link-icon"></span>tectonic-feedback@coreos.com</a></p> }
  </div>
</div>;
