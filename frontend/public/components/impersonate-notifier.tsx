import { useCallback } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Banner, Flex, Button, Tooltip } from '@patternfly/react-core';
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

    const handleStopImpersonate = useCallback(() => {
      stopImpersonate();
      // Navigate after dispatch to ensure impersonation state is reset.
      setTimeout(() => {
        window.location.href = window.SERVER_FLAGS.basePath || '/';
      }, 0);
    }, [stopImpersonate]);

    if (!impersonate) {
      return null;
    }
    const kindTranslated = modelFor(impersonate.kind)?.labelKey
      ? t(modelFor(impersonate.kind).labelKey)
      : impersonate.kind;
    const impersonateName = impersonate.name;

    // Handle UserWithGroups display with enhanced group support
    const isUserWithGroups = impersonate.kind === 'UserWithGroups';
    const displayKind = isUserWithGroups ? 'user' : kindTranslated;
    const displayKindForAccess = isUserWithGroups ? 'multi-group' : kindTranslated;

    // Enhanced group display with tooltip for many groups
    const MAX_GROUPS_DISPLAY = 2;
    const groups = impersonate.groups || [];
    const hasGroups = isUserWithGroups && groups.length > 0;
    const visibleGroups = groups.slice(0, MAX_GROUPS_DISPLAY);
    const remainingCount = Math.max(0, groups.length - MAX_GROUPS_DISPLAY);

    const groupsElement = hasGroups ? (
      <>
        {remainingCount > 0 ? (
          <>
            {t('public~ with groups: {{visibleGroups}}, and ', {
              visibleGroups: visibleGroups.join(', '),
            })}
            <Tooltip
              content={
                <div>
                  {groups.map((group, index) => (
                    <div key={index}>{group}</div>
                  ))}
                </div>
              }
            >
              <Button variant="link" isInline className="pf-v6-u-text-decoration-underline-dotted">
                {t('public~{{count}} more', { count: remainingCount })}
              </Button>
            </Tooltip>
          </>
        ) : (
          t('public~ with groups: {{groups}}', { groups: visibleGroups.join(', ') })
        )}
      </>
    ) : null;

    return (
      <Banner color="blue">
        <Flex
          justifyContent={{ default: 'justifyContentCenter' }}
          flexWrap={{ default: 'nowrap' }}
          gap={{ default: 'gapSm' }}
        >
          <div>
            {t('public~You are impersonating {{kind}} ', { kind: displayKind })}
            <strong>{impersonateName}</strong>
            {groupsElement}
            {t('public~. You are viewing all resources and roles this {{kind}} can access. ', {
              kind: displayKindForAccess,
            })}
            <Button
              isInline
              type="button"
              variant="link"
              style={{ color: 'inherit' }}
              onClick={handleStopImpersonate}
            >
              {t('public~Stop impersonating')}
            </Button>
          </div>
        </Flex>
      </Banner>
    );
  },
);
