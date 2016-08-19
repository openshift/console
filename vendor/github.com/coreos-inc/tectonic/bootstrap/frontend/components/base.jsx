import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { Pager } from './pager';

export const Base = connect(
  (state) => {
    return {
      state: state,
    };
  },
  undefined, // mapDispatchToProps
  undefined, // mergeProps
  {pure: false} // base isn't pure - it depends on context.router
)(class extends React.Component {
  static get contextTypes() {
    return {
      router: React.PropTypes.object.isRequired,
    };
  }

  render() {
    const {route, state, children} = this.props;

    const pagerInfo = Pager.readInfo(route, this.context.router, state);

    const routeToLink = (route) => {
      let step = <span>{route.title}</span>;
      if (route.index >= pagerInfo.pageStart && route.index <= pagerInfo.pageLimit) {
        step = <Link to={route.path}>{route.title}</Link>;
      }

      const classes = classNames('wiz-wizard__nav__element', {
        active: route === pagerInfo.currentRoute,
      });
      return <li className={classes} key={route.path}>{step}</li>;
    };

    let defineLinks = [];
    let bootLinks = [];

    switch (pagerInfo.currentRoute.section) {
    case 'define':
      defineLinks = route.sections.define.map(routeToLink);
      break;
    case 'boot':
      bootLinks = route.sections.boot.map(routeToLink);
      break;
    default:
      // don't show anything but headers in these cases.
    }

    const kids = React.Children.map(children, el => {
      return React.cloneElement(el, {
        pagerInfo: pagerInfo,
      });
    });

    return (
      <div className="wiz-wizard">
        <div className="wiz-wizard__nav wiz-wizard__cell">
          <h2 className="wiz-wizard__nav__heading">1. Define Cluster</h2>
          <ul>
            {defineLinks}
          </ul>
          <h2 className="wiz-wizard__nav__heading">2. Boot Cluster</h2>
          <ul>
            {bootLinks}
          </ul>
        </div>
        <div className="wiz-wizard__content wiz-wizard__cell">
          {kids}
        </div>
      </div>
    );
  }
});
