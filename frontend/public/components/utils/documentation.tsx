import * as React from 'react';
import * as _ from 'lodash-es';

import { productName } from '../../branding';

// Prefer the documentation base URL passed as a flag, but fall back to the latest docs if none was specified.
export const openshiftHelpBase = (window as any).SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';

/* global
  HELP_TOPICS: false,
  GET_STARTED_CLI: false,
  NETWORK_POLICY_GUIDE: false,
 */
export enum HELP_TOPICS {
  GET_STARTED_CLI = 'cli_reference/get_started_cli.html',
  NETWORK_POLICY_GUIDE = 'admin_guide/managing_networking.html#admin-guide-networking-networkpolicy',
}

export const helpLink = (topic: HELP_TOPICS) => `${openshiftHelpBase}${topic}`;

/* eslint-disable react/jsx-no-target-blank */
export const DocumentationLinks = () => <dl className="co-documentation-links">
  <dt className="co-documentation-links__title"><a href={openshiftHelpBase} target="_blank" rel="noopener">Full Documentation</a></dt>
  <dd className="co-documentation-links__description">
    From getting started with creating your first application, to trying out more advanced build and deployment techniques, these resources
    provide what you need to set up and manage your environment as a cluster administrator or an application developer.
  </dd>
  <dt className="co-documentation-links__title"><a href={helpLink(HELP_TOPICS.GET_STARTED_CLI)} target="_blank" rel="noopener">Get Started with the CLI</a></dt>
  <dd className="co-documentation-links__description">
    With the {productName} command line interface (CLI), you can create applications and manage projects from a terminal. Learn how to install
    and use the oc client tool.
  </dd>
</dl>;

const supportLinks = [{
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

export const AdditionalSupportLinks = () => <ul className="co-additional-support-links">
  {_.map(supportLinks, (link, i) => <li key={i}>
    <a href={link.href} target="_blank" rel="noopener" className="co-additional-support-links__link">{link.title}</a>
  </li>)}
</ul>;
/* eslint-enable react/jsx-no-target-blank */

export const DocumentationSidebar = props => <div className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered">
  <div className="co-m-pane__body">
    <h1 className="co-p-has-sidebar__sidebar-heading co-p-has-sidebar__sidebar-heading--first">Documentation</h1>
    <DocumentationLinks />
    <h1 className="co-p-has-sidebar__sidebar-heading">Additional Support</h1>
    <AdditionalSupportLinks />
  </div>
  {props.children}
</div>;
