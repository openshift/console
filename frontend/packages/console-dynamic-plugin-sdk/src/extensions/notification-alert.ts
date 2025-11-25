import { Alert } from '../api/common-types';
import { LaunchModal } from '../app/modal-support/ModalProvider';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** This extension can be used to trigger a specific action when a specific Prometheus alert is observed by the Console based on its `rule.name` value. */
export type AlertAction = ExtensionDeclaration<
  'console.alert-action',
  {
    /** Alert name as defined by `alert.rule.name` property */
    alert: string;
    /** Action text */
    text: string;
    /** Function to perform side effect */
    action: CodeRef<(alert: Alert, launchModal: LaunchModal) => void>;
  }
>;

export const isAlertAction = (e: Extension): e is AlertAction => e.type === 'console.alert-action';
