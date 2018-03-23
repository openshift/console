import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { UIActions } from '../ui/ui-actions';
import { GlobalNotification } from './global-notification';
import { history } from './utils';

export const ImpersonateNotifier = connect(
  ({UI}) => ({impersonate: UI.get('impersonate')}),
  {stopImpersonate: UIActions.stopImpersonate}
)(({stopImpersonate, impersonate}) => {
  if (!impersonate) {
    return null;
  }
  const onClick = () => {
    stopImpersonate();
    history.push('/');
  };
  const content = <span>You are impersonating <strong>{impersonate.name}</strong>. You are viewing all resources and roles this {_.toLower(impersonate.kind)} can access. <a onClick={onClick}>Stop Impersonation</a></span>;
  return <GlobalNotification content={content} title={`Impersonating ${impersonate.kind}`} />;
});
