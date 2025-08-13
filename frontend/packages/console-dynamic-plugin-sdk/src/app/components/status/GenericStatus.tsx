import * as React from 'react';
import { StatusComponentProps } from '../../../extensions/console-types';
import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';

type GenericStatusProps = StatusComponentProps & {
  Icon: React.ComponentType<{ title?: string }>;
  popoverTitle?: string;
  noTooltip?: boolean;
};

/**
 * Component for displaying a generic status with customizable icon and optional popover content.
 *
 * This is a foundational component for building status displays throughout the Console.
 * It provides a flexible way to show status information with consistent styling and
 * behavior patterns, including tooltips and popover content.
 *
 * **Common use cases:**
 * - Custom status indicators for application-specific states
 * - Building status components for custom resources
 * - Status displays with additional context in popovers
 * - Reusable status patterns across different plugin interfaces
 *
 * **Visual behavior:**
 * - Shows icon with optional text label
 * - Provides tooltip on hover (unless disabled)
 * - Opens popover with additional content when children provided
 * - Supports icon-only mode for compact displays
 *
 * **Popover integration:**
 * - When children are provided, component becomes clickable
 * - Popover displays additional status details or actions
 * - Popover title can be customized or defaults to main title
 * - Consistent popover styling throughout Console
 *
 * **Accessibility features:**
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support for popover triggers
 * - Screen reader friendly status announcements
 * - Focus management for popover interactions
 *
 * **Edge cases:**
 * - Gracefully handles missing or invalid icons
 * - Empty children array doesn't trigger popover mode
 * - Works with both functional and class components as icons
 * - Handles dynamic title and children updates
 *
 * @example
 * ```tsx
 * // Basic status with icon and text
 * const CustomStatus: React.FC<{state: string}> = ({state}) => {
 *   return (
 *     <GenericStatus
 *       Icon={CheckCircleIcon}
 *       title={`Application ${state}`}
 *       className="custom-status"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Status with popover content
 * const DetailedStatus: React.FC<{metrics: MetricsData}> = ({metrics}) => {
 *   return (
 *     <GenericStatus
 *       Icon={MonitoringIcon}
 *       title="Monitoring"
 *       popoverTitle="System Metrics"
 *     >
 *       <div>
 *         <p>CPU Usage: {metrics.cpu}%</p>
 *         <p>Memory: {metrics.memory}%</p>
 *         <p>Last Updated: {metrics.timestamp}</p>
 *       </div>
 *     </GenericStatus>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Icon-only status for compact displays
 * const CompactStatus: React.FC<{isHealthy: boolean}> = ({isHealthy}) => {
 *   return (
 *     <GenericStatus
 *       Icon={isHealthy ? CheckCircleIcon : ExclamationTriangleIcon}
 *       title={isHealthy ? "Healthy" : "Warning"}
 *       iconOnly={true}
 *       className="status-compact"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom status with conditional popover
 * const ConditionalStatus: React.FC<{error?: Error, status: string}> = ({error, status}) => {
 *   return (
 *     <GenericStatus
 *       Icon={error ? ExclamationCircleIcon : InfoCircleIcon}
 *       title={status}
 *       popoverTitle={error ? "Error Details" : undefined}
 *     >
 *       {error && (
 *         <Alert variant="danger" isInline>
 *           <p>{error.message}</p>
 *           <p>Code: {error.code}</p>
 *         </Alert>
 *       )}
 *     </GenericStatus>
 *   );
 * };
 * ```
 *
 * @param Icon React component type that renders the status icon. Should accept optional title prop for accessibility
 * @param title Optional status text displayed next to icon and used for tooltip content
 * @param iconOnly Optional boolean to show only the icon without text label (default: false)
 * @param noTooltip Optional boolean to disable tooltip display (default: false)
 * @param className Optional additional CSS class name for custom styling
 * @param popoverTitle Optional title for the popover header, defaults to main title if not provided
 * @param children Optional React elements to display in popover. When provided, component becomes clickable and shows popover on interaction
 */
const GenericStatus: React.FC<GenericStatusProps> = (props) => {
  const { Icon, children, popoverTitle, title, noTooltip, iconOnly, ...restProps } = props;
  const renderIcon = iconOnly && !noTooltip ? <Icon title={title} /> : <Icon />;
  const statusBody = (
    <StatusIconAndText
      {...restProps}
      noTooltip={noTooltip}
      title={title}
      iconOnly={iconOnly}
      icon={renderIcon}
    />
  );
  return React.Children.toArray(children).length ? (
    <PopoverStatus title={popoverTitle || title} {...restProps} statusBody={statusBody}>
      {children}
    </PopoverStatus>
  ) : (
    statusBody
  );
};

export default GenericStatus;
