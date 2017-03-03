import React from 'react';
import classNames from 'classnames';

import {ActionsMenu, kindObj, ResourceIcon} from './index';

export const NavTitle = (props) => <div className={classNames('row', props.detail ? 'co-m-nav-title__detail' : 'co-m-nav-title')}>
  <div className="col-xs-12">
    <h1 className={classNames('co-m-page-title', {'co-m-page-title--detail': props.detail})}>
      {props.kind && <ResourceIcon kind={props.kind} className="co-m-page-title__icon" />} <span>{props.title}</span>
      {props.menuActions && !_.isEmpty(props.data) && <ActionsMenu actions={props.menuActions.map(a => a(kindObj(props.kind), props.data))} />}
    </h1>
  </div>
</div>;
