import * as React from 'react';
import * as classNames from 'classnames';

import {NavSection, ClusterPickerNavSection, UserNavSection} from './okdcomponents';
import {formatNamespacedRouteForResource} from "../ui/okdui-actions";

// With respect to keep changes to OKD codebase at bare minimum,
// the navigation needs to be reconstructed
export default ({ isOpen, onToggle, close, scroller, onWheel }) => {
  return (
    <React.Fragment>
      <button type="button" className="sidebar-toggle" aria-controls="sidebar" aria-expanded={isOpen}
              onClick={onToggle}>
        <span className="sr-only">Toggle navigation</span>
        <span className="icon-bar" aria-hidden="true"></span>
        <span className="icon-bar" aria-hidden="true"></span>
        <span className="icon-bar" aria-hidden="true"></span>
      </button>
      <div id="sidebar" className={classNames({'open': isOpen})}>
        <ClusterPickerNavSection/>
        <div ref={scroller} onWheel={onWheel} className="navigation-container">
          <NavSection text="Virtual Machines" href={formatNamespacedRouteForResource('virtualmachines')} icon="pficon pficon-home" />
          <UserNavSection closeMenu={close}/>
        </div>
      </div>
    </React.Fragment>
  );
};
