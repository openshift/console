import { CodeIcon } from '@patternfly/react-icons';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { Perspective, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { getFlagsObject, flagPending } from '@console/internal/reducers/features';
import { RootState } from '@console/internal/redux';
import { FLAGS } from '@console/shared/src/constants/common';

export const usePerspectiveDetection = () => {
  const flags = useSelector((state: RootState) => getFlagsObject(state));
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
