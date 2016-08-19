import React from 'react';
import classNames from 'classnames';
import Chalupa from './chalupa';

const isActive = (href) => {
  const current = location.pathname.split('/').slice(-1)[0];
  if (current === href) {
    return true;
  }
  return false;
}

export default (pages) => {
  return class asVertNav extends React.Component {
    render () {
      let Page;

      const nav = _.map(pages, ({name, href, component}) => {
        const active = isActive(href);
        if (active) {
          Page = component;
        }
        const klass = classNames('co-m-vert-nav__menu-item',
          {'co-m-vert-nav-item--active': active}
        );
        return <li className={klass} key={name}>
          <Chalupa href={href}>{name}</Chalupa>
        </li>;
      });

      return <div className="co-m-pane co-m-vert-nav">
        <ul className="co-m-vert-nav__menu">
          {nav}
        </ul>
        <div className="co-m-vert-nav__body">
          <Page {...this.props} />
        </div>
      </div>
    }
  }
};
