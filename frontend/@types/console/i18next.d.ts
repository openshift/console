// import the original type declarations
import "i18next";
import "react-i18next";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import all namespaces (for the default language, only)
// import ns1 from "locales/en/ns1.json";
// import ns2 from "locales/en/ns2.json";
import { resources, defaultNS } from "./i18n";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: 'custom';
    fallbackNS: 'fallback';
    jsonFormat: 'v3';
    fallbackLng: "en";
    // custom resources type
    resources: {
      // ns1: typeof ns1;
      // ns2: typeof ns2;
    };
    // other
    // backend: {
    //   // loadPath: string;
    //   //   parse:  (data: any, lng:any, ns: any) => any;
    //   // }
    //   options: InitOptions<{ loadPath: string; parse: (data: any, lng: any, ns: any) => any; }
    // }
  }
}

declare module "@openshift-console/dynamic-plugin-sdk" ;
// declare module 'i18next' {
//   interface InitOptions {
//     backend?: {
//       loadPath: string;
//       parse: (data: string, lng: string, ns: string) => { [key: string]: string };
//     };
//     react?: {
//       useSuspense?: boolean;
//       transSupportBasicHtmlNodes?: boolean;
//     };
//   }

//   interface CustomTypeOptions {
//     defaultNS: 'public';
//     resources: {
//       // TBD
//       public: {};
//     };
//   }
//  // TBD: Whether to remove the `wait` property in init() or add a type definition like this.
//  interface ReactOptions {
//   // The wait property is for backward compatibility
//   // The wait property in ReactOptions has been deprecated in newer versions of
//   // react-i18next. Instead, you should use the useSuspense property to control
//   // whether React Suspense is used for loading translations.
//   wait?: boolean;
// }
// }