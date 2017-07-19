import React from 'react';
import classNames from 'classnames';

import { StatusBox, RelativeLink } from './index';
import { EditYAML } from '../edit-yaml';
import { PodsPage } from '../pod';

export const navFactory = {
  details: (component = undefined) => ({
    href: 'details',
    name: 'Overview',
    component,
  }),
  events: (component = undefined) => ({
    href: 'events',
    name: 'Events',
    component,
  }),
  logs: (component = undefined) => ({
    href: 'logs',
    name: 'Logs',
    component,
  }),
  editYaml: () => ({
    href: 'yaml',
    name: 'YAML',
    component: (props) => <EditYAML obj={props} />,
  }),
  pods: (component = undefined) => ({
    href: 'pods',
    name: 'Pods',
    component: component || (({metadata: {namespace}, spec: {selector}}) => <PodsPage showTitle={false} namespace={namespace} selector={selector} />),
  }),
  roles: (component = undefined) => ({
    href: 'roles',
    name: 'Role Bindings',
    component,
  }),
  serviceMonitors: (component = undefined) => ({
    href: 'servicemonitors',
    name: 'Service Monitor',
    component,
  }),
};

const activeSlug = () => location.pathname.split('/').pop();

export const NavBar = ({pages}) => {
  const divider = <li className="co-m-vert-nav__menu-item co-m-vert-nav__menu-item--divider" key="_divider" />;

  return <ul className="co-m-vert-nav__menu">{_.flatten(_.map(pages, ({name, href}, i) => {
    const klass = classNames('co-m-vert-nav__menu-item', {'co-m-vert-nav-item--active': href === activeSlug()});
    const tab = <li className={klass} key={name}><RelativeLink to={href}>{name}</RelativeLink></li>;

    // These tabs go before the divider
    const before = ['details', 'edit', 'yaml'];
    return (!before.includes(href) && i !== 0 && before.includes(pages[i - 1].href)) ? [divider, tab] : [tab];
  }))}</ul>;
};

export const VertNav = props => {
  const Page = _.get(_.find(props.pages, {href: activeSlug()}), 'component');
  const routeProps = _.pick(props, ['location', 'params', 'route', 'routeParams', 'router']);

  return <div className={props.className}>
    <div className="co-m-pane co-m-vert-nav">
      {!props.hideNav && <NavBar pages={props.pages} />}
      <div className="co-m-vert-nav__body">
        {Page && <StatusBox {...props}><Page {...routeProps} /></StatusBox>}
      </div>
    </div>
  </div>;
};

VertNav.propTypes = {
  pages: React.PropTypes.arrayOf(React.PropTypes.shape({
    href: React.PropTypes.string,
    name: React.PropTypes.string,
    component: React.PropTypes.func,
  })),
  className: React.PropTypes.string,
  hideNav: React.PropTypes.bool,
};
