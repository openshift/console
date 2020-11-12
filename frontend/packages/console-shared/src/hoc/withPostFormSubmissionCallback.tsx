import * as React from 'react';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { usePostFormSubmitAction } from '../hooks/post-form-submit-action';

type WithPostFormSubmissionCallbackProps<R> = {
  postFormSubmissionCallback: (arg: R) => Promise<R>;
};

export const withPostFormSubmissionCallback = <
  Props extends WithPostFormSubmissionCallbackProps<R>,
  R = K8sResourceCommon
>(
  Component: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithPostFormSubmissionCallbackProps<R>>> => (props: Props) => {
  const postFormSubmissionCallback = usePostFormSubmitAction<R>();
  return <Component {...props} postFormSubmissionCallback={postFormSubmissionCallback} />;
};
