import * as React from 'react';
import { VictoryPortal } from 'victory-core';

/**
 * Added custom type definitions as victory-core uses a synthetic default import for React
 * which is not compatible with the `./frontend` tsconfig
 **/
declare module 'victory-core' {
  export declare class VictoryPortal extends React.Component<VictoryPortalProps> {}
}
