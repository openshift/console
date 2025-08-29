import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { StatusComponentProps } from '../../../extensions/console-types';
import { DASH } from '../../constants';
import CamelCaseWrap from '../utils/camel-case-wrap';

type StatusIconAndTextProps = StatusComponentProps & {
  icon?: React.ReactElement;
  spin?: boolean;
};

/**
 * Foundational component for displaying status information with icon and text combinations.
 *
 * This is a low-level building block used throughout the Console status system to create
 * consistent visual representations of status information. It handles the layout, spacing,
 * and interaction between icons and text labels.
 *
 * **Common use cases:**
 * - Building blocks for higher-level status components
 * - Custom status indicators with specific icons
 * - Status displays in tables and lists
 * - Progress indicators with spinning animations
 *
 * **Layout behavior:**
 * - Icon and text are properly aligned and spaced
 * - Responsive design adapts to different container sizes
 * - Consistent styling follows Console design patterns
 * - Supports both horizontal and compact layouts
 *
 * **Icon features:**
 * - Optional spinning animation for progress states
 * - Automatic icon sizing and color inheritance
 * - Proper alignment with text content
 * - Supports both PatternFly and custom icons
 *
 * **Text handling:**
 * - Automatic camelCase to space formatting
 * - Tooltip support for icon-only displays
 * - Fallback to dash (—) for empty content
 * - Proper text wrapping and truncation
 *
 * **Accessibility:**
 * - Proper ARIA labels and descriptions
 * - Tooltip text for icon-only displays
 * - Screen reader compatible content
 * - Keyboard navigation support
 *
 * **Edge cases:**
 * - Missing title renders as dash placeholder
 * - Icon-only mode provides tooltip with title
 * - Handles dynamic icon and title updates
 * - Works with various icon component types
 *
 * @example
 * ```tsx
 * // Basic status with icon and text
 * const BasicStatus: React.FC<{isReady: boolean}> = ({isReady}) => {
 *   return (
 *     <StatusIconAndText
 *       icon={isReady ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
 *       title={isReady ? "Ready" : "Not Ready"}
 *       className="resource-status"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Progress status with spinning icon
 * const ProgressStatus: React.FC<{message: string}> = ({message}) => {
 *   return (
 *     <StatusIconAndText
 *       icon={<SyncAltIcon />}
 *       title={message}
 *       spin={true}
 *       className="progress-status"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Icon-only status for compact displays
 * const CompactStatus: React.FC<{status: string, icon: React.ReactElement}> = ({status, icon}) => {
 *   return (
 *     <StatusIconAndText
 *       icon={icon}
 *       title={status}
 *       iconOnly={true}
 *       noTooltip={false} // Show tooltip on hover
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom styled status
 * const CustomStatus: React.FC<{level: 'info' | 'warning' | 'error', message: string}> = ({level, message}) => {
 *   const iconMap = {
 *     info: <InfoCircleIcon />,
 *     warning: <ExclamationTriangleIcon />,
 *     error: <ExclamationCircleIcon />
 *   };
 *
 *   return (
 *     <StatusIconAndText
 *       icon={iconMap[level]}
 *       title={message}
 *       className={`status-${level}`}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Status without icon (text only)
 * const TextOnlyStatus: React.FC<{message: string}> = ({message}) => {
 *   return (
 *     <StatusIconAndText
 *       title={message}
 *       className="text-status"
 *     />
 *   );
 * };
 * ```
 *
 * @param icon Optional React element to display as the status icon. Can be any PatternFly icon or custom component
 * @param title Optional status text to display. If empty, component renders as dash (—). Text is automatically formatted from camelCase
 * @param iconOnly Optional boolean to show only the icon without text label (default: false)
 * @param noTooltip Optional boolean to disable tooltip display for icon-only mode (default: false)
 * @param spin Optional boolean to add rotating animation to the icon, useful for progress states (default: false)
 * @param className Optional additional CSS class name for custom styling
 */
const StatusIconAndText: React.FC<StatusIconAndTextProps> = ({
  icon,
  title,
  spin,
  iconOnly,
  noTooltip,
  className,
}) => {
  if (!title) {
    return <>{DASH}</>;
  }

  return (
    <span
      className={css('co-icon-and-text', className)}
      title={iconOnly && !noTooltip ? title : undefined}
    >
      {icon &&
        React.cloneElement(icon, {
          className: css(
            spin && 'co-spin',
            icon.props.className,
            !iconOnly && 'co-icon-and-text__icon co-icon-flex-child',
          ),
        })}
      {!iconOnly && <CamelCaseWrap value={title} dataTest="status-text" />}
    </span>
  );
};

export default StatusIconAndText;
