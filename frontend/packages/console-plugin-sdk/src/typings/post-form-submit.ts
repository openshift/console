import { Extension } from './base';

namespace ExtensionProperties {
  export interface PostFormSubmissionAction<T, P> {
    /** action type */
    type: string;
    /** callback for the related action */
    callback: (arg: T, payload?: P) => Promise<T>;
  }
}

export interface PostFormSubmissionAction<R = any, P = string>
  extends Extension<ExtensionProperties.PostFormSubmissionAction<R, P>> {
  type: 'PostFormSubmissionAction';
}

export const isPostFormSubmissionAction = (e: Extension): e is PostFormSubmissionAction => {
  return e.type === 'PostFormSubmissionAction';
};
