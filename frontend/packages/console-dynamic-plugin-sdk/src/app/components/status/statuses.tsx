import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import { StatusComponentProps } from '../../../extensions/console-types';
import GenericStatus from './GenericStatus';
import { RedExclamationCircleIcon, GreenCheckCircleIcon, BlueInfoCircleIcon } from './icons';

/**
 * Component for displaying an error status popover.
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, tooltip is not displayed
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <ErrorStatus title={errorMsg} />
 * ```
 */
export const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={RedExclamationCircleIcon} />
);
ErrorStatus.displayName = 'ErrorStatus';

/**
 * Component for displaying an information status popover.
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, tooltip is not displayed
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <InfoStatus title={infoMsg} />
 * ```
 */
export const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={BlueInfoCircleIcon} />
);
InfoStatus.displayName = 'InfoStatus';

/**
 * Component for displaying a progressing status popover.
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, tooltip is not displayed
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <ProgressStatus title={progressMsg} />
 * ```
 */
export const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InProgressIcon} />
);
ProgressStatus.displayName = 'ProgressStatus';

/**
 * Component for displaying a success status popover.
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, tooltip is not displayed
 * @param {string} [className] - (optional) additional class name for the component
 * @param {string} [popoverTitle] - (optional) title for popover
 * @example
 * ```tsx
 * <SuccessStatus title={successMsg} />
 * ```
 */
export const SuccessStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={GreenCheckCircleIcon} />
);
SuccessStatus.displayName = 'SuccessStatus';
