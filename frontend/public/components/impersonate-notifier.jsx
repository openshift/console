import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { getImpersonate } from '@console/dynamic-plugin-sdk';

import * as UIActions from '../actions/ui';
import { modelFor } from '../module/k8s';

export const ImpersonateNotifier = connect((state) => ({ impersonate: getImpersonate(state) }), {
  stopImpersonate: UIActions.stopImpersonate,
})(({ stopImpersonate, impersonate }) => {
  const { t } = useTranslation();
  if (!impersonate) {
    return null;
  }
  const kindTranslated = modelFor(impersonate.kind)?.labelKey
    ? t(modelFor(impersonate.kind).labelKey)
    : impersonate.kind;
  const impersonateName = impersonate.name;
  return (
    <div className="co-global-notification">
      <div className="co-global-notification__content">
        <p className="co-global-notification__text">
          <span className="text-uppercase co-global-notification__impersonate-kind">
            {t('public~Impersonating {{kind}}', {
              kind: kindTranslated,
            })}
          </span>{' '}
          <Trans t={t} ns="public">
            You are impersonating{' '}
            <span className="co-global-notification__impersonate-name">{{ impersonateName }}</span>.
            You are viewing all resources and roles this {{ kindTranslated }} can access.
          </Trans>{' '}
          <Button isInline type="button" variant="link" onClick={stopImpersonate}>
            {t('public~Stop impersonation')}
          </Button>
        </p>
      </div>
    </div>
  );
});
