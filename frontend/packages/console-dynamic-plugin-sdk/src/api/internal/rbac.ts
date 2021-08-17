import * as React from 'react';
import {
  AccessReviewResourceAttributes,
  AccessReviewsResult,
  K8sResourceCommon,
  K8sVerb,
  ObjectMetadata,
} from '../../extensions/console-types';
import { K8sKind } from '../common-types';

export type UseAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: any,
) => [boolean, boolean];

export type UseMultipleAccessReviews = (
  multipleResourceAttributes: AccessReviewResourceAttributes[],
  impersonate?: boolean,
) => [AccessReviewsResult[], boolean];

export type AsAccessReview = (
  kindObj: K8sKind,
  obj: K8sResourceCommon,
  verb: K8sVerb,
  subresource?: string,
) => AccessReviewResourceAttributes;

export type CheckAccess = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?,
) => Promise<{
  apiVersion: string;
  kind: string;
  metadata?: ObjectMetadata;
  spec: {
    resourceAttributes?: AccessReviewResourceAttributes;
  };
  status?: {
    allowed: boolean;
    denied?: boolean;
    reason?: string;
    evaluationError?: string;
  };
}>;

export type RequireCreatePermissionProps = {
  model: K8sKind;
  namespace?: string;
  impersonate?: string;
  children: React.ReactNode;
};

export type RequireCreatePermissionComponent = React.FC<RequireCreatePermissionProps>;
