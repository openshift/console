import { Extension } from './base';
import { Alert } from '@console/internal/components/monitoring/types';

namespace ExtensionProperties {
  export interface AlertAction {
    /* Alert name as defined by `alert.rule.name` property */
    alert: string;
    /* Action text */
    text: string;
    /* Action href link */
    path: (alert: Alert) => string;
    /* A unique id for the alert  */
    dataTestID?: string;
  }
}

export interface AlertAction extends Extension<ExtensionProperties.AlertAction> {
  type: 'AlertAction';
}

export function isAlertAction(e: Extension): e is AlertAction {
  return e.type === 'AlertAction';
}
