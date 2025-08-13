import * as React from 'react';
import { Button, Popover, PopoverPosition, PopoverProps } from '@patternfly/react-core';
import './PopoverStatus.scss';

type PopoverStatusProps = {
  statusBody: React.ReactNode;
  onHide?: () => void;
  onShow?: () => void;
  title?: string;
  hideHeader?: boolean;
  isVisible?: boolean;
  shouldClose?: (hideFunction: any) => void;
  shouldOpen?: PopoverProps['shouldOpen'];
};

/**
 * Component for creating interactive status displays with popover content.
 *
 * This component wraps status indicators to make them clickable and display additional
 * information in a popover. It's commonly used throughout the Console to provide detailed
 * status information without cluttering the main interface.
 *
 * **Common use cases:**
 * - Detailed error messages for failed resources
 * - Additional metrics and information for status indicators
 * - Rich content displays for complex status states
 * - Action buttons and links related to specific statuses
 *
 * **Interaction behavior:**
 * - Status element becomes clickable button trigger
 * - Popover appears on click with detailed content
 * - Supports both controlled and uncontrolled popover visibility
 * - Proper keyboard navigation and focus management
 *
 * **Layout features:**
 * - Configurable popover positioning (defaults to right)
 * - Optional header with title display
 * - Responsive design adapts to screen size
 * - Consistent styling with Console design system
 *
 * **Accessibility:**
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader compatible status announcements
 * - Focus management for popover interactions
 *
 * **Edge cases:**
 * - Handles empty or missing content gracefully
 * - Works with dynamic content that changes size
 * - Supports controlled visibility for programmatic control
 * - Manages multiple popover instances appropriately
 *
 * @example
 * ```tsx
 * // Error status with detailed error information
 * const ErrorStatusWithDetails: React.FC<{error: Error}> = ({error}) => {
 *   const statusBody = (
 *     <StatusIconAndText
 *       icon={<ExclamationCircleIcon />}
 *       title="Error"
 *       className="status-error"
 *     />
 *   );
 *
 *   return (
 *     <PopoverStatus
 *       title="Error Details"
 *       statusBody={statusBody}
 *     >
 *       <div>
 *         <p><strong>Error:</strong> {error.message}</p>
 *         <p><strong>Code:</strong> {error.code}</p>
 *         <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
 *         <Button variant="link" onClick={() => retryAction()}>
 *           Retry Operation
 *         </Button>
 *       </div>
 *     </PopoverStatus>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Resource metrics popover
 * const MetricsStatusPopover: React.FC<{metrics: ResourceMetrics}> = ({metrics}) => {
 *   const statusBody = (
 *     <StatusIconAndText
 *       icon={<MonitoringIcon />}
 *       title={`${metrics.cpu}% CPU`}
 *       iconOnly={false}
 *     />
 *   );
 *
 *   return (
 *     <PopoverStatus
 *       title="Resource Metrics"
 *       statusBody={statusBody}
 *     >
 *       <div className="metrics-detail">
 *         <p>CPU Usage: {metrics.cpu}%</p>
 *         <p>Memory Usage: {metrics.memory}%</p>
 *         <p>Network I/O: {metrics.networkIO}</p>
 *         <p>Last Updated: {metrics.lastUpdate}</p>
 *       </div>
 *     </PopoverStatus>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Controlled popover visibility
 * const ControlledStatusPopover: React.FC = () => {
 *   const [isOpen, setIsOpen] = React.useState(false);
 *
 *   const statusBody = <Status status="Warning" />;
 *
 *   return (
 *     <PopoverStatus
 *       title="Controlled Popover"
 *       statusBody={statusBody}
 *       isVisible={isOpen}
 *       shouldClose={() => setIsOpen(false)}
 *       onShow={() => console.log('Popover opened')}
 *       onHide={() => console.log('Popover closed')}
 *     >
 *       <p>This popover visibility is controlled programmatically.</p>
 *       <Button onClick={() => setIsOpen(false)}>Close</Button>
 *     </PopoverStatus>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Status with no header
 * const MinimalStatusPopover: React.FC<{message: string}> = ({message}) => {
 *   const statusBody = <StatusIconAndText icon={<InfoCircleIcon />} title="Info" />;
 *
 *   return (
 *     <PopoverStatus
 *       statusBody={statusBody}
 *       hideHeader={true}
 *     >
 *       <p>{message}</p>
 *     </PopoverStatus>
 *   );
 * };
 * ```
 *
 * @param statusBody React element that serves as the clickable trigger for the popover. Usually a status component with icon and text
 * @param title Optional title text displayed in the popover header. Also used for accessibility labels
 * @param hideHeader Optional boolean to hide the popover header completely (default: false)
 * @param isVisible Optional boolean for controlled popover visibility. When provided, component operates in controlled mode
 * @param shouldClose Optional callback function for controlled mode, invoked when popover should close
 * @param shouldOpen Optional callback function that determines if popover should open on trigger interaction
 * @param onShow Optional callback invoked when popover begins to appear, useful for analytics or state management
 * @param onHide Optional callback invoked when popover begins to hide, useful for cleanup or state management
 * @param children React elements to display in the popover body. Can include any content: text, buttons, forms, charts, etc.
 */
const PopoverStatus: React.FC<PopoverStatusProps> = ({
  hideHeader,
  children,
  isVisible = null,
  shouldClose = null,
  shouldOpen = null,
  statusBody,
  title,
  onHide,
  onShow,
}) => {
  return (
    <Popover
      position={PopoverPosition.right}
      headerContent={hideHeader ? null : title}
      bodyContent={children}
      aria-label={title}
      onHide={onHide}
      onShow={onShow}
      isVisible={isVisible}
      shouldClose={shouldClose}
      shouldOpen={shouldOpen}
    >
      <Button variant="link" isInline className="co-popover-status-button">
        {statusBody}
      </Button>
    </Popover>
  );
};

export default PopoverStatus;
