import * as React from 'react';
import * as classNames from'classnames';
import * as PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { StatusBox, RelativeLink } from './index';
import { PodsPage } from '../pod';
import { AsyncComponent } from '../utils/async';

const editYamlComponent = (props) => <AsyncComponent loader={() => System.import('../edit-yaml').then(c => c.EditYAML)} obj={props.obj} />;

class PodsComponent extends React.PureComponent {
  render() {
    const {metadata: {namespace}, spec: {selector}} = this.props.obj;
    return <PodsPage showTitle={false} namespace={namespace} selector={selector} />;
  }
}

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
  editYaml: (component = editYamlComponent) => ({
    href: 'yaml',
    name: 'YAML',
    component: component,
  }),
  pods: (component = undefined) => ({
    href: 'pods',
    name: 'Pods',
    component: component || PodsComponent,
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
NavBar.displayName = 'NavBar';

/** @augments {React.PureComponent<any>} */
export class VertNav extends React.PureComponent {
  render () {
    const props = this.props;

    const componentProps = _.pick(props, ['filters', 'selected', 'match']);
    componentProps.obj = props.data;

    return <div className={props.className}>
      <div className="co-m-pane co-m-vert-nav">

        {!props.hideNav && <NavBar pages={props.pages} />}

        <div className="co-m-vert-nav__body">
          <StatusBox {...props}>
            <Switch>
              {props.pages.map(p => <Route path={`${props.match.path}/${p.href}`} exact key={p.name} render={() =>
                <p.component {...componentProps} />} />)}
            </Switch>
          </StatusBox>
        </div>
      </div>
    </div>;
  }
}

VertNav.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.shape({
    href: PropTypes.string,
    name: PropTypes.string,
    component: PropTypes.func,
  })),
  className: PropTypes.string,
  hideNav: PropTypes.bool,
  match: PropTypes.shape({
    path: PropTypes.string,
  }),
};
