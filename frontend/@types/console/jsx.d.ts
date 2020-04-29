import 'react';

// Support the new `loading` attribute on images
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    loading?: 'lazy' | 'eager' | 'auto';
  }
}
