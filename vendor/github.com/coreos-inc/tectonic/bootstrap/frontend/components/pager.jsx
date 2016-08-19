import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router';

// info as constructed by Pager.readInfo
export const Pager = ({info}) => {
  const {currentRoute, nextPath, prevPath, pageStart, pageLimit} = info;
  let nextLink = '';
  if (nextPath !== undefined) {
    const nextLinkClasses = classNames('btn', 'btn-primary', 'wiz-form__actions__next', {
      disabled: currentRoute.index >= pageLimit,
    });

    nextLink = <Link to={nextPath} className={nextLinkClasses}>Next Step</Link>;
  }

  let prevLink = '';
  if (prevPath !== undefined && currentRoute.index > pageStart) {
    prevLink = <Link to={prevPath}
                     className="btn btn-default wiz-form__actions__prev"
                     >Previous Step</Link>;
  }

  return (
    <div className="wiz-form__actions">
      {prevLink}
      {nextLink}
    </div>
  );
};

Pager.readInfo = (route, router, state) => {
  const current = route.activeChild(router);
  return {
    currentRoute: current,
    prevPath: route.pathFromIndex(current.index - 1),
    nextPath: route.pathFromIndex(current.index + 1),
    pageStart: route.firstNavigablePage(state),
    pageLimit: route.lastNavigablePage(state),
  };
};
