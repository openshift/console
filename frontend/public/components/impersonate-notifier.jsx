import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Banner, Flex, Button } from '@patternfly/react-core';
import { getImpersonate } from '@console/dynamic-plugin-sdk';

import * as UIActions from '../actions/ui';
import { modelFor } from '../module/k8s';

export const ImpersonateNotifier = connect((state) => ({ impersonate: getImpersonate(state) }), {
  stopImpersonate: UIActions.stopImpersonate,
})(({ stopImpersonate, impersonate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!impersonate) {
    return null;
  }
  const kindTranslated = modelFor(impersonate.kind)?.labelKey
    ? t(modelFor(impersonate.kind).labelKey)
    : impersonate.kind;
  const impersonateName = impersonate.name;
  return (
    <Banner color="blue">
      <Flex
        justifyContent={{ default: 'justifyContentCenter' }}
        flexWrap={{ default: 'nowrap' }}
        gap={{ default: 'sm' }}
      >
        <strong>
          {t('public~Impersonating {{kind}}', {
            kind: kindTranslated,
          })}
        </strong>{' '}
        <p>
          <Trans t={t} ns="public">
            You are impersonating <strong>{{ impersonateName }}</strong>. You are viewing all
            resources and roles this {{ kindTranslated }} can access.
          </Trans>{' '}
          <Button
            isInline
            type="button"
            variant="link"
            style={{ color: 'inherit' }}
            onClick={() => {
              stopImpersonate();
              navigate(window.SERVER_FLAGS.basePath);
            }}
          >
            {t('public~Stop impersonation')}
          </Button>
        </p>
      </Flex>
    </Banner>
  );
});
