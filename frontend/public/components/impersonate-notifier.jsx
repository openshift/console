import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { UIActions } from '../ui/ui-actions';

export const ImpersonateNotifier = connect(
  ({UI}) => ({impersonate: UI.get('impersonate')}),
  {stopImpersonate: UIActions.stopImpersonate}
)(({stopImpersonate, impersonate}) => {
  if (!impersonate) {
    return null;
  }
  return <div className="co-global-notification">
    <div className="co-global-notification__content">
      <p className="co-global-notification__text">
        <span className="text-uppercase co-global-notification__impersonate-kind">{`Impersonating ${impersonate.kind}`}</span> You are impersonating <span className="co-global-notification__impersonate-name">{impersonate.name}</span>. You are viewing all resources and roles this {_.toLower(impersonate.kind)} can access. <a onClick={stopImpersonate}>Stop Impersonation</a>
      </p>
    </div>
  </div>;
});
