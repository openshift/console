import React from 'react';
import classNames from 'classnames';

import {register} from '../react-wrapper';
import {ResourceIcon} from './index';

export const NavTitle = (props) => <div className={classNames('row', {'co-m-nav-title__detail': props.detail}, {'co-m-nav-title': !props.detail})}>
  <div className="col-xs-12">
    <h1 className={classNames('co-m-page-title', {'co-m-page-title--detail': props.detail})}>
      {props.kind && <ResourceIcon kind={props.kind} className="co-m-page-title__icon" />}
      <span>{props.title}</span>
    </h1>
  </div>
</div>;

register('NavTitle', NavTitle);
