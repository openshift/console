import { connect } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Banner, Flex, Button } from '@patternfly/react-core';
import { getImpersonate, ImpersonateKind } from '@console/dynamic-plugin-sdk';

import * as UIActions from '../actions/ui';
import { modelFor } from '../module/k8s';
import { RootState } from '@console/internal/redux';

export const ImpersonateNotifier = connect(
  (state: RootState) => ({ impersonate: getImpersonate(state) }),
  {
    stopImpersonate: UIActions.stopImpersonate,
  },
)(
  ({
    stopImpersonate,
    impersonate,
  }: {
    stopImpersonate: () => void;
    impersonate: ImpersonateKind;
  }) => {
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
          gap={{ default: 'gapSm' }}
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
  },
);
