import React from 'react';
import classNames from 'classnames';

import {register} from '../react-wrapper';
import yamlize from '../../module/service/yamlize';
import {detailsPage, StatusBox, RelativeLink} from './index';
import { EditYAML } from '../edit-yaml';

export const navFactory = {
  details: (component = undefined) => ({
    href: 'details',
    name: 'Overview',
    component: component,
  }),
  edit: (component = undefined) => ({
    href: 'edit',
    name: 'Edit',
    component: component,
  }),
  events: (component = undefined) => ({
    href: 'events',
    name: 'Events',
    component: component,
  }),
  logs: (component = undefined) => ({
    href: 'logs',
    name: 'Logs',
    component: component,
  }),
  yaml: () => ({
    href: 'yaml',
    name: 'YAML',
    component: detailsPage((resource) => <div className="col-xs-12"><div className="co-m-pane__body"><pre className="co-pre-wrap">{yamlize(resource)}</pre></div></div>),
  }),
  editYaml: () => ({
    href: 'edit-yaml',
    name: 'Edit',
    component: EditYAML,
  }),
};

const activeSlug = () => location.pathname.split('/').pop();

export const NavBar = ({pages}) => {
  const divider = <li className="co-m-vert-nav__menu-item co-m-vert-nav__menu-item--divider" key="_divider" />;

  return <ul className="co-m-vert-nav__menu">{_.flatten(_.map(pages, ({name, href}, i) => {
    const klass = classNames('co-m-vert-nav__menu-item', {'co-m-vert-nav-item--active': href === activeSlug()});
    const tab = <li className={klass} key={name}><RelativeLink href={href}>{name}</RelativeLink></li>;

    // These tabs go before the divider
    const before = ['details', 'edit'];
    return (!before.includes(href) && i !== 0 && before.includes(pages[i - 1].href)) ? [divider, tab] : [tab];
  }))}</ul>;
};
register('NavBar', NavBar);

export const VertNav = props => {
  const Page = _.get(_.find(props.pages, {href: activeSlug()}), 'component');

  return <div className={props.className}>
    <div className="co-m-pane co-m-vert-nav">
      {!props.hideNav && <NavBar pages={props.pages} />}
      <div className="co-m-vert-nav__body">
        {Page && <StatusBox {...props}><Page /></StatusBox>}
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
