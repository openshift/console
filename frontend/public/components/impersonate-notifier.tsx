import * as React from 'react';
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

    // Memory leak prevention - track component mount state
    const isMountedRef = React.useRef(true);
    React.useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // Safe handler to prevent memory leaks
    const handleStopImpersonate = React.useCallback(() => {
      stopImpersonate();
      // Use window.location to avoid React state updates on unmounted component
      setTimeout(() => {
        if (isMountedRef.current) {
          window.location.href = window.SERVER_FLAGS.basePath || '/';
        }
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
        {' with groups: '}
        <strong>
          {visibleGroups.join(', ')}
          {remainingCount > 0 && (
            <>
              {', and '}
              <Tooltip
                content={
                  <div>
                    {groups.map((group, index) => (
                      <div key={index}>{group}</div>
                    ))}
                  </div>
                }
              >
                <span
                  style={{
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'dotted',
                    cursor: 'help',
                  }}
                >
                  {remainingCount} more
                </span>
              </Tooltip>
            </>
          )}
        </strong>
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
            You're impersonating {displayKind} <strong>{impersonateName}</strong>
            {groupsElement}. You're viewing all resources and roles this {displayKindForAccess} can
            access.{' '}
            <Button
              isInline
              type="button"
              variant="link"
              style={{ color: 'inherit' }}
              onClick={handleStopImpersonate}
            >
              Stop impersonating
            </Button>
          </div>
        </Flex>
      </Banner>
    );
  },
);
