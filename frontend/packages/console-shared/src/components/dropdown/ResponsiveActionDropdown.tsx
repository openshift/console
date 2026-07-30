import type { FC, ReactNode, Ref } from 'react';
import { useCallback, useContext, useState } from 'react';
import {
  Dropdown,
  DropdownList,
  MenuToggle,
  OverflowMenu,
  OverflowMenuContent,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
// Import context from source since it's not in public API
import { OverflowMenuContext } from '@patternfly/react-core/dist/esm/components/OverflowMenu/OverflowMenuContext';
import { RhUiEllipsisVerticalIcon } from '@patternfly/react-icons';

export type ResponsiveActionDropdownProps = {
  /** Label for the action button (shown on desktop) */
  label: string;
  /** Dropdown items to display */
  children: ReactNode;
  /** Whether the dropdown is disabled */
  isDisabled?: boolean;
  /** Optional test ID for the toggle button */
  'data-test'?: string;
  /** Optional aria-label for the kebab toggle (mobile). If not provided, uses label. */
  'aria-label'?: string;
  /** Breakpoint at which to switch between primary button and kebab menu */
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Button variant for desktop view. Mobile always uses 'plain' for kebab menu. Defaults to 'primary'. */
  variant?: 'default' | 'primary' | 'secondary' | 'plainText' | 'typeahead';
};

type InternalDropdownProps = {
  label: string;
  children: ReactNode;
  isDisabled?: boolean;
  'data-test'?: string;
  'aria-label'?: string;
  variant: 'default' | 'primary' | 'secondary' | 'plainText' | 'typeahead';
};

/**
 * Internal component that consumes OverflowMenuContext to render the dropdown
 * with breakpoint-aware styling.
 */
const InternalDropdown: FC<InternalDropdownProps> = ({
  label,
  children,
  isDisabled,
  'data-test': dataTest,
  'aria-label': ariaLabel,
  variant,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isBelowBreakpoint } = useContext(OverflowMenuContext);

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const onSelect = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggle}
          isExpanded={isOpen}
          variant={isBelowBreakpoint ? 'plain' : variant}
          isDisabled={isDisabled}
          data-test={dataTest}
          aria-label={isBelowBreakpoint ? ariaLabel || label : undefined}
        >
          {isBelowBreakpoint ? <RhUiEllipsisVerticalIcon /> : label}
        </MenuToggle>
      )}
    >
      <DropdownList>{children}</DropdownList>
    </Dropdown>
  );
};

/**
 * A responsive action dropdown that switches between a button (desktop)
 * and a kebab menu (mobile) based on breakpoint.
 *
 * Uses PatternFly's OverflowMenu to handle breakpoint detection automatically.
 *
 * @example
 * ```tsx
 * <ResponsiveActionDropdown
 *   label="Actions"
 *   variant="primary"
 *   data-test="actions-dropdown"
 * >
 *   <DropdownItem onClick={handleAction1}>Action 1</DropdownItem>
 *   <DropdownItem onClick={handleAction2}>Action 2</DropdownItem>
 * </ResponsiveActionDropdown>
 * ```
 */
export const ResponsiveActionDropdown: FC<ResponsiveActionDropdownProps> = ({
  label,
  children,
  isDisabled = false,
  'data-test': dataTest,
  'aria-label': ariaLabel,
  breakpoint = 'md',
  variant = 'primary',
}) => {
  return (
    <OverflowMenu breakpoint={breakpoint}>
      <OverflowMenuContent isPersistent>
        <InternalDropdown
          label={label}
          isDisabled={isDisabled}
          data-test={dataTest}
          aria-label={ariaLabel}
          variant={variant}
        >
          {children}
        </InternalDropdown>
      </OverflowMenuContent>
    </OverflowMenu>
  );
};
