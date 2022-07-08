import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import { StatusComponentProps } from '../../../extensions/console-types';
import GenericStatus from './GenericStatus';
import { RedExclamationCircleIcon, GreenCheckCircleIcon, BlueInfoCircleIcon } from './icons';

/**
 * Component for displaying an error status popover
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, does not display tooltip
 * @param {string} [className] - (optional) class name for styling
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <ErrorStatus />
 * ```
 */
export const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={RedExclamationCircleIcon} />
);
ErrorStatus.displayName = 'ErrorStatus';

/**
 * Component for displaying an information status popover
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, does not display tooltip
 * @param {string} [className] - (optional) class name for styling
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <InfoStatus />
 * ```
 */
export const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={BlueInfoCircleIcon} />
);
InfoStatus.displayName = 'InfoStatus';

/**
 * Component for displaying a progressing status popover
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, does not display tooltip
 * @param {string} [className] - (optional) class name for styling
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <ProgressStatus />
 * ```
 */
export const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InProgressIcon} />
);
ProgressStatus.displayName = 'ProgressStatus';

/**
 * Component for displaying a success status popover
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, does not display tooltip
 * @param {string} [className] - (optional) class name for styling
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <SuccessStatus />
 * ```
 */
export const SuccessStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={GreenCheckCircleIcon} />
);
SuccessStatus.displayName = 'SuccessStatus';
