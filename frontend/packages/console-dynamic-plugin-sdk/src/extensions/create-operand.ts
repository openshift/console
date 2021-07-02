import { match as RouterMatch } from 'react-router';
import { ExtensionK8sModel } from '../api/common-types';
import { CodeRef, Extension, ExtensionDeclaration } from '../types';

export type CreateOperand = ExtensionDeclaration<
  'console.olm/create-operand',
  {
    /** The model for which this create operand page will be rendered. */
    model: ExtensionK8sModel;
    /** The component to be rendered when the model matches */
    component: CodeRef<
      React.ComponentType<{
        match: RouterMatch<{
          /** Name of the OLM operator */
          appName: string;
          /** Current namespace */
          ns: string;
        }>;
      }>
    >;
  }
>;

// Type guards

export const isCreateOperand = (e: Extension): e is CreateOperand =>
  e.type === 'console.olm/create-operand';
