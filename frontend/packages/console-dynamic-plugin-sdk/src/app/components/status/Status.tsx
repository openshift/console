import * as React from 'react';
import {
  BanIcon,
  ClipboardListIcon,
  HourglassHalfIcon,
  HourglassStartIcon,
  NotStartedIcon,
  SyncAltIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { StatusComponentProps } from '../../../extensions/console-types';
import { DASH } from '../../constants';
import { YellowExclamationTriangleIcon } from './icons';
import { ErrorStatus, InfoStatus, ProgressStatus, SuccessStatus } from './statuses';
import StatusIconAndText from './StatusIconAndText';

export type StatusProps = StatusComponentProps & {
  status: string;
  children?: React.ReactNode;
};

/**
 * Component for displaying standardized status indicators with predefined styles and icons.
 *
 * This component provides a comprehensive set of predefined status types commonly used
 * throughout Kubernetes and OpenShift environments. It automatically maps status strings
 * to appropriate icons and colors, ensuring consistent status representation across the Console.
 *
 * **Common use cases:**
 * - Displaying Pod phase status (Running, Pending, Failed, etc.)
 * - Showing deployment rollout status (Progressing, Complete, Failed)
 * - Resource health indicators (Ready, Not Ready, Warning)
 * - Installation and upgrade status displays
 *
 * **Status categories:**
 * - **Progress states**: New, Pending, Installing, Updating, In Progress
 * - **Success states**: Complete, Ready, Active, Bound, Succeeded
 * - **Warning states**: Warning, RequiresApproval
 * - **Error states**: Failed, Error, CrashLoopBackOff, ImagePullBackOff
 * - **Cancelled states**: Cancelled, Deleting, Terminating, Superseded
 *
 * **Icon mapping:**
 * - Each status type has a predefined icon for visual consistency
 * - Colors follow PatternFly design system conventions
 * - Icons are semantically meaningful and accessible
 * - Fallback behavior for unknown status values
 *
 * **Extensibility:**
 * - Supports children content for additional status details
 * - Can be used with popover content for more information
 * - Allows custom styling through className prop
 * - Works with existing tooltip and accessibility systems
 *
 * **Edge cases:**
 * - Unknown status values render as plain text or dash
 * - Empty/null status values display as dash (—)
 * - Children content triggers enhanced status display modes
 * - Handles case-sensitive status matching
 *
 * @example
 * ```tsx
 * // Basic pod status display
 * const PodStatusBadge: React.FC<{pod: PodKind}> = ({pod}) => {
 *   const phase = pod.status?.phase || 'Unknown';
 *
 *   return (
 *     <Status
 *       status={phase}
 *       title={`Pod is ${phase.toLowerCase()}`}
 *       className="pod-status"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Deployment rollout status with additional info
 * const DeploymentStatus: React.FC<{deployment: DeploymentKind}> = ({deployment}) => {
 *   const condition = deployment.status?.conditions?.find(c => c.type === 'Progressing');
 *   const status = condition?.status === 'True' ? 'Progressing' : 'Complete';
 *
 *   return (
 *     <Status status={status} iconOnly={true}>
 *       {condition && (
 *         <div>
 *           <p>Reason: {condition.reason}</p>
 *           <p>Message: {condition.message}</p>
 *           <p>Last Update: {condition.lastUpdateTime}</p>
 *         </div>
 *       )}
 *     </Status>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom resource installation status
 * const OperatorStatus: React.FC<{csv: ClusterServiceVersionKind}> = ({csv}) => {
 *   const phase = csv.status?.phase || 'Unknown';
 *
 *   return (
 *     <div className="operator-status">
 *       <Status status={phase} />
 *       {phase === 'Failed' && (
 *         <Status status="Error">
 *           <Alert variant="danger">
 *             Installation failed. Check operator logs for details.
 *           </Alert>
 *         </Status>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Status list for multiple conditions
 * const ResourceConditions: React.FC<{conditions: K8sCondition[]}> = ({conditions}) => {
 *   return (
 *     <div className="conditions-list">
 *       {conditions.map(condition => {
 *         const status = condition.status === 'True' ? 'Ready' :
 *                       condition.status === 'False' ? 'Not Ready' : 'Unknown';
 *
 *         return (
 *           <div key={condition.type} className="condition-item">
 *             <span>{condition.type}:</span>
 *             <Status
 *               status={status}
 *               title={`${condition.type}: ${condition.status}`}
 *               noTooltip={false}
 *             />
 *           </div>
 *         );
 *       })}
 *     </div>
 *   );
 * };
 * ```
 *
 * @param status The status string that determines which icon and color to display. Common values include: 'Running', 'Pending', 'Failed', 'Complete', 'Warning', 'Error', etc.
 * @param title Optional custom text to display next to the icon. If not provided, defaults to the status value
 * @param iconOnly Optional boolean to show only the icon without text label (default: false)
 * @param noTooltip Optional boolean to disable tooltip display (default: false)
 * @param className Optional additional CSS class name for custom styling
 * @param children Optional React elements to display in enhanced status mode, typically used for detailed status information or error messages
 */
const Status: React.FC<StatusProps> = ({
  status,
  title,
  children,
  iconOnly,
  noTooltip,
  className,
}) => {
  const statusProps = { title: title || status, iconOnly, noTooltip, className };
  switch (status) {
    case 'New':
      return <StatusIconAndText {...statusProps} icon={<HourglassStartIcon />} />;

    case 'Pending':
      return <StatusIconAndText {...statusProps} icon={<HourglassHalfIcon />} />;

    case 'Planning':
      return <StatusIconAndText {...statusProps} icon={<ClipboardListIcon />} />;

    case 'ContainerCreating':
    case 'UpgradePending':
    case 'PendingUpgrade':
    case 'PendingRollback':
      return <ProgressStatus {...statusProps} />;

    case 'In Progress':
    case 'Installing':
    case 'InstallReady':
    case 'Replacing':
    case 'Running':
    case 'Updating':
    case 'Upgrading':
    case 'PendingInstall':
      return <StatusIconAndText {...statusProps} icon={<SyncAltIcon />} />;

    case 'Cancelled':
    case 'Deleting':
    case 'Expired':
    case 'Not Ready':
    case 'Cancelling':
    case 'Terminating':
    case 'Superseded':
    case 'Uninstalling':
      return <StatusIconAndText {...statusProps} icon={<BanIcon />} />;

    case 'Warning':
    case 'RequiresApproval':
      return <StatusIconAndText {...statusProps} icon={<YellowExclamationTriangleIcon />} />;

    case 'ContainerCannotRun':
    case 'CrashLoopBackOff':
    case 'Critical':
    case 'ErrImagePull':
    case 'Error':
    case 'Failed':
    case 'Failure':
    case 'ImagePullBackOff':
    case 'InstallCheckFailed':
    case 'Lost':
    case 'Rejected':
    case 'UpgradeFailed':
      return <ErrorStatus {...statusProps}>{children}</ErrorStatus>;

    case 'Accepted':
    case 'Active':
    case 'Bound':
    case 'Complete':
    case 'Completed':
    case 'Created':
    case 'Enabled':
    case 'Succeeded':
    case 'Ready':
    case 'Up to date':
    case 'Loaded':
    case 'Provisioned as node':
    case 'Preferred':
    case 'Connected':
    case 'Deployed':
      return <SuccessStatus {...statusProps} />;

    case 'Info':
      return <InfoStatus {...statusProps}>{children}</InfoStatus>;

    case 'Unknown':
      return <StatusIconAndText {...statusProps} icon={<UnknownIcon />} />;

    case 'PipelineNotStarted':
      return <StatusIconAndText {...statusProps} icon={<NotStartedIcon />} />;

    default:
      return status ? <StatusIconAndText {...statusProps} /> : <>{DASH}</>;
  }
};

export default Status;
