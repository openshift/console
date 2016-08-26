import React from 'react';
import classNames from 'classnames';

import {StatusBox, RelativeLink} from './index';

const isActive = (href) => {
  const current = location.pathname.split('/').slice(-1)[0];
  if (current === href) {
    return true;
  }
  return false;
}

export class VertNav extends React.Component {
  render () {
    let Page;
    const {pages} = this.props;

    const nav = _.map(pages, ({name, href, component}) => {
      const active = isActive(href);
      if (active) {
        Page = component;
      }
      const klass = classNames('co-m-vert-nav__menu-item',
        {'co-m-vert-nav-item--active': active}
      );

      return <li className={klass} key={name}>
        <RelativeLink href={href}>{name}</RelativeLink>
      </li>;
    });

    return <div className={this.props.className}>
      <div className="co-m-pane co-m-vert-nav">
        <ul className="co-m-vert-nav__menu">
          {nav}
        </ul>
        <div className="co-m-vert-nav__body">
          <StatusBox {...this.props}><Page /></StatusBox>
        </div>
      </div>
    </div>
  }
}

VertNav.propTypes = {
  pages: React.PropTypes.arrayOf(React.PropTypes.shape({
    href: React.PropTypes.string,
    name: React.PropTypes.string,
    component: React.PropTypes.func,
  })),
};
