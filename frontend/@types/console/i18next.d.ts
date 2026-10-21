import 'i18next';

declare module 'i18next' {
  /** @see https://www.i18next.com/overview/typescript#custom-type-options */
  interface CustomTypeOptions {
    /**
     * Allows for objects to be used as children with Trans components.
     *
     * This is fine because the {{ }} syntax is treated by i18next as a string
     * replacement for interpolation.
     *
     * @see https://github.com/i18next/react-i18next/issues/1483#issuecomment-1827603003
     */
    allowObjectInHTMLChildren: true;
  }
}
