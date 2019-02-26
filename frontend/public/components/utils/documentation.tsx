import * as React from 'react';
import * as _ from 'lodash-es';

import { ExternalLink } from '../utils';

// Prefer the documentation base URL passed as a flag, but fall back to the latest docs if none was specified.
export const openshiftHelpBase = (window as any).SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';

/* eslint-disable react/jsx-no-target-blank */
export const DocumentationLinks = () => <dl className="co-documentation-links">
  <dt className="co-documentation-links__title"><ExternalLink href={openshiftHelpBase} text="Full Documentation" /></dt>
  <dd className="co-documentation-links__description">
    From getting started with creating your first application, to trying out more advanced build and deployment techniques, these resources
    provide what you need to set up and manage your environment as a cluster administrator or an application developer.
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
    <ExternalLink href={link.href} text={link.title} additionalClassName="co-additional-support-links__link" />
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
