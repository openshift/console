import 'react';

// Support the new `loading` attribute on images
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    loading?: 'lazy' | 'eager' | 'auto';
  }

  // Type def for a childless FunctionComponent
  type FCC<P> = (props: P) => ReactElement | null;
}
