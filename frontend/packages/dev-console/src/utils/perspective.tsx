import { CodeIcon } from '@patternfly/react-icons/dist/esm/icons/code-icon';
import type { Perspective, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { getFlagsObject, flagPending } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared/src/constants/common';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const usePerspectiveDetection = () => {
  const flags = useConsoleSelector((state) => getFlagsObject(state));
  const canGetNS = flags.CAN_GET_NS;
  const loadingFlag = flagPending(canGetNS);
  const enablePerspective = !canGetNS;

  return [enablePerspective, loadingFlag] as [boolean, boolean];
};

export const icon: ResolvedExtension<Perspective>['properties']['icon'] = { default: CodeIcon };

export const getLandingPageURL: ResolvedExtension<Perspective>['properties']['landingPageURL'] = (
  flags,
  isFirstVisit,
) => (!flags[FLAGS.OPENSHIFT] || isFirstVisit ? '/add' : '/topology');

export const getImportRedirectURL: ResolvedExtension<
  Perspective
>['properties']['importRedirectURL'] = (namespace) => `/topology/ns/${namespace}`;
