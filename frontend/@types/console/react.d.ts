import 'react';

// Support the new `loading` attribute on images
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    loading?: 'lazy' | 'eager' | 'auto';
  }

  // Type def for a childless FunctionComponent
  interface FCC<P = {}> {
    (props: P, context?: any): ReactElement | null;
    propTypes?: FunctionComponent<P>['propTypes'];
    contextTypes?: FunctionComponent<P>['contextTypes'];
    defaultProps?: FunctionComponent<P>['defaultProps'];
    displayName?: FunctionComponent<P>['displayName'];
  }
}
