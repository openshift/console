import * as React from 'react';
import * as classNames from'classnames';
import * as _ from 'lodash';

import { ActionsMenu, kindObj, ResourceIcon } from './index';
import { AppTypeLogo } from '../cloud-services';

/** @type {React.StatelessComponent.<{kind?: string, detail?: boolean, title?: string, menuActions?: any[], data?: any[] | any}}> */
export const NavTitle = ({kind, detail, title, menuActions, data}) => {
  const hasLogo = !_.isEmpty(data) && _.has(data, 'spec.icon');
  const logo = hasLogo
    ? <AppTypeLogo icon={_.get(data, 'spec.icon', [])[0]} displayName={data.spec.displayName} provider={data.spec.provider} />
    : <div>{ kind && <ResourceIcon kind={kind} className="co-m-page-title__icon" /> } <span>{title}</span></div>;

  return <div className={classNames('row', detail ? 'co-m-nav-title__detail' : 'co-m-nav-title')}>
    <div className="col-xs-12">
      <h1 className={classNames('co-m-page-title', {'co-m-page-title--detail': detail}, {'co-m-page-title--logo': hasLogo})}>
        {logo}
        { menuActions && !_.isEmpty(data) && !_.has(data.metadata, 'deletionTimestamp') && <ActionsMenu actions={menuActions.map(a => a(kindObj(kind), data))} /> }
      </h1>
    </div>
  </div>; 
};

NavTitle.displayName = 'NavTitle';

