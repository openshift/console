import { createContext } from 'react';

export type PageTitleContextValues = {
  telemetryPrefix?: string;
  titlePrefix?: string;
};

export const PageTitleContext = createContext<PageTitleContextValues>({});
