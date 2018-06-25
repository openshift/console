import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';

import { FLAGS, connectToFlags } from '../../features';

export const tectonicHelpBase = 'https://coreos.com/tectonic/docs/latest/';

// Prefer the documentation base URL passed as a flag, but fall back to the latest docs if none was specified.
export const openshiftHelpBase = (window as any).SERVER_FLAGS.documentationBaseURL || 'https://docs.openshift.org/latest/';

/* global
  HELP_TOPICS: false,
  GET_STARTED_CLI: false,
 */
enum HELP_TOPICS {
  GET_STARTED_CLI = 'cli_reference/get_started_cli.html',
}
const helpLink = (topic: HELP_TOPICS) => `${openshiftHelpBase}${topic}`;

/* eslint-disable react/jsx-no-target-blank */
export const TectonicDocumentationLinks = () => <dl className="co-documentation-links">
  <dt className="co-documentation-links__title"><a href="https://coreos.com/tectonic/docs/latest/account/manage-account.html" target="_blank" rel="noopener">Manage Your Account</a></dt>
  <dd className="co-documentation-links__description">You can manage your Tectonic account at <a href="https://account.coreos.com" target="_blank" rel="noopener">account.coreos.com</a> for access to licenses, billing details, invoices, and account users.</dd>
  <dt className="co-documentation-links__title"><a href="https://coreos.com/tectonic/docs/latest/usage/" target="_blank" rel="noopener">End User Guide</a></dt>
  <dd className="co-documentation-links__description">End-users of Tectonic are expected to deploy applications directly in Kubernetes. Your application&rsquo;s architecture will drive how you assemble these components together.</dd>
</dl>;

export const TectonicAdditionalSupportLinks = () => <div className="co-additional-support-links">
  <p><Link to="/start-guide" className="co-additional-support-links__link"><span className="fa fa-fw fa-info-circle co-additional-support-links__link-icon"></span>Quick Start Guide</Link></p>
  <p><a href={tectonicHelpBase} target="_blank" rel="noopener" className="co-additional-support-links__link"><span className="fa fa-fw fa-book co-additional-support-links__link-icon"></span>Full Documentation</a></p>
  <p><a href="https://github.com/coreos/tectonic-forum" target="_blank" rel="noopener noreferrer" className="co-additional-support-links__link"><span className="fa fa-fw fa-comments-o co-additional-support-links__link-icon"></span>Tectonic Forum</a></p>
</div>;

export const OpenShiftDocumentationLinks = () => <dl className="co-documentation-links">
  <dt className="co-documentation-links__title"><a href={openshiftHelpBase} target="_blank" rel="noopener">Full Documentation</a></dt>
  <dd className="co-documentation-links__description">
    From getting started with creating your first application, to trying out more advanced build and deployment techniques, these resources
    provide what you need to set up and manage your environment as a cluster administrator or an application developer.
  </dd>
  <dt className="co-documentation-links__title"><a href={helpLink(HELP_TOPICS.GET_STARTED_CLI)} target="_blank" rel="noopener">Get Started with the CLI</a></dt>
  <dd className="co-documentation-links__description">
    With the OpenShift command line interface (CLI), you can create applications and manage projects from a terminal. Learn how to install
    and use the oc client tool.
  </dd>
</dl>;

const osSupportLinks = [{
  title: 'Interactive Learning Portal',
  href: 'https://learn.openshift.com',
}, {
  title: 'Local Development',
  href: 'https://www.openshift.org/minishift',
}, {
  title: 'YouTube',
  href: 'https://www.youtube.com/user/rhopenshift',
}, {
  title: 'Blog',
  href: 'https://blog.openshift.com',
}];

export const OpenShiftAdditionalSupportLinks = () => <ul className="co-additional-support-links">
  {_.map(osSupportLinks, (link, i) => <li key={i}>
    <a href={link.href} target="_blank" rel="noopener" className="co-additional-support-links__link">{link.title}</a>
  </li>)}
</ul>;
/* eslint-enable react/jsx-no-target-blank */

const DocumentationSidebar_ = props => {
  const openshiftFlag = props.flags[FLAGS.OPENSHIFT];
  if (openshiftFlag === undefined) {
    return null;
  }
  return <div className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered">
    <div className="co-m-pane__body">
      <h1 className="co-p-has-sidebar__sidebar-heading co-p-has-sidebar__sidebar-heading--first">Documentation</h1>
      {openshiftFlag ? <OpenShiftDocumentationLinks /> : <TectonicDocumentationLinks />}
      <h1 className="co-p-has-sidebar__sidebar-heading">Additional Support</h1>
      {openshiftFlag ? <OpenShiftAdditionalSupportLinks /> : <TectonicAdditionalSupportLinks />}
    </div>
    {props.children}
  </div>;
};

export const DocumentationSidebar = connectToFlags(FLAGS.OPENSHIFT)(DocumentationSidebar_);
