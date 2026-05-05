import type { HTMLAttributes, PropsWithChildren } from 'react';

/**
 * Knative-plugin RTL stubs for `@console/internal/components/utils` jest mocks.
 * Uses data-test (see frontend/setup-tests.js). Props are forwarded as DOM attrs for assertions.
 */
export const knativeInternalUtilsStubs = {
  /** Mirrors string-mock ResourceLink DOM attrs; cast avoids TS span prop strictness. */
  ResourceLink: (props: Record<string, unknown>) => (
    <span {...(props as HTMLAttributes<HTMLSpanElement>)} data-test="mock-ResourceLink" />
  ),
  SidebarSectionHeading: ({
    text,
    children,
    className,
  }: PropsWithChildren<{ text?: string; className?: string }>) => (
    <div data-test="mock-SidebarSectionHeading" className={className}>
      {text ? <h2>{text}</h2> : null}
      {children}
    </div>
  ),
};

export const createKnativeTextStub = (text: string) => () => <span>{text}</span>;
