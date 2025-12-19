import type { ComponentType, FC } from 'react';
import { useTelemetry } from '../hooks';

type WithTelemetryProps = {
  fireTelementryEvent: (eventType: string, properties: any) => void;
};

export const withTelemetry = <Props extends WithTelemetryProps>(
  WrappedComponent: ComponentType<Props>,
): FC<Omit<Props, keyof WithTelemetryProps>> => {
  const Component = (props: Props) => {
    const fireTelemetryEvent = useTelemetry();
    return <WrappedComponent {...props} fireTelemetryEvent={fireTelemetryEvent} />;
  };
  Component.displayName = `withTelemetry(${WrappedComponent.displayName || WrappedComponent.name})`;
  return Component;
};
