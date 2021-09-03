import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type AlertAction = ExtensionDeclaration<
  'console.alert-action',
  {
    /* Alert name as defined by `alert.rule.name` property */
    alert: string;
    /* Action text */
    text: string;
    /* Function to perform side effect */
    action: CodeRef<(alert) => void>;
  }
>;

export const isAlertAction = (e: Extension): e is AlertAction => e.type === 'console.alert-action';
