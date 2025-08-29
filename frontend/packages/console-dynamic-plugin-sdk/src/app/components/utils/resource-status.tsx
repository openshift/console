import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import './resource-status.scss';

type ResourceStatusProps = {
  additionalClassNames?: string;
  badgeAlt?: boolean;
  children: React.ReactNode;
};

/**
 * Component that wraps status indicators with a styled badge container for consistent resource status displays.
 *
 * This component provides a standardized visual container for resource status information
 * throughout the Console. It creates a consistent badge appearance with proper spacing
 * and styling that integrates with the overall design system.
 *
 * **Common use cases:**
 * - Wrapping status components in resource tables
 * - Displaying resource health indicators in lists
 * - Creating consistent status badges in cards and detail views
 * - Standardizing status appearance across different contexts
 *
 * **Visual appearance:**
 * - Creates a rounded badge container with consistent styling
 * - Provides proper padding and spacing for status content
 * - Integrates with PatternFly design system colors and typography
 * - Supports both standard and alternative styling variants
 *
 * **Layout behavior:**
 * - Maintains consistent badge sizing across different status types
 * - Provides proper alignment within parent containers
 * - Handles text overflow and wrapping appropriately
 * - Responsive design adapts to container constraints
 *
 * **Accessibility features:**
 * - Includes data-test attributes for automated testing
 * - Maintains semantic HTML structure
 * - Preserves screen reader compatibility of child content
 * - Supports keyboard navigation patterns
 *
 * **Edge cases:**
 * - Handles empty or missing child content gracefully
 * - Works with various status component types
 * - Supports dynamic content updates
 * - Maintains visual consistency with different badge variants
 *
 * @example
 * ```tsx
 * // Basic resource status badge
 * const PodStatusBadge: React.FC<{pod: PodKind}> = ({pod}) => {
 *   return (
 *     <ResourceStatus>
 *       <Status status={pod.status?.phase || 'Unknown'} />
 *     </ResourceStatus>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Alternative badge styling
 * const CustomStatusBadge: React.FC<{status: string}> = ({status}) => {
 *   return (
 *     <ResourceStatus badgeAlt={true} additionalClassNames="custom-status">
 *       <StatusIconAndText
 *         icon={<CheckCircleIcon />}
 *         title={status}
 *       />
 *     </ResourceStatus>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Table cell with status badge
 * const StatusCell: React.FC<{resource: K8sResourceKind}> = ({resource}) => {
 *   const condition = resource.status?.conditions?.find(c => c.type === 'Ready');
 *   const status = condition?.status === 'True' ? 'Ready' : 'Not Ready';
 *
 *   return (
 *     <TableData id="status">
 *       <ResourceStatus>
 *         <Status status={status} />
 *       </ResourceStatus>
 *     </TableData>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Complex status with custom content
 * const DetailedStatusBadge: React.FC<{metrics: ResourceMetrics}> = ({metrics}) => {
 *   return (
 *     <ResourceStatus additionalClassNames="metrics-badge">
 *       <GenericStatus
 *         Icon={MonitoringIcon}
 *         title={`${metrics.healthScore}%`}
 *       >
 *         <div className="metrics-detail">
 *           <p>Health Score: {metrics.healthScore}%</p>
 *           <p>Last Check: {metrics.lastUpdate}</p>
 *         </div>
 *       </GenericStatus>
 *     </ResourceStatus>
 *   );
 * };
 * ```
 *
 * @param children React elements to render inside the badge container. Typically status components like Status, GenericStatus, or StatusIconAndText
 * @param additionalClassNames Optional additional CSS class names for custom styling and theming
 * @param badgeAlt Optional boolean to use alternative badge styling variant for different visual contexts
 */
const ResourceStatus: React.FC<ResourceStatusProps> = ({
  additionalClassNames,
  badgeAlt,
  children,
}) => {
  return (
    <span className={css('dps-resource-item__resource-status', additionalClassNames)}>
      <Badge
        className={css('dps-resource-item__resource-status-badge', {
          'dps-resource-item__resource-status-badge--alt': badgeAlt,
        })}
        isRead
        data-test="resource-status"
      >
        {children}
      </Badge>
    </span>
  );
};

export default ResourceStatus;
