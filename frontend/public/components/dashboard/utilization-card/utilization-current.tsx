import * as React from 'react';

export const UtilizationCurrentValue: React.FC<UtilizationCurrentValueProps> = ({ value, max }) => (
  <>
    {value}
    <br />
    {max && <span className="co-utilization-card__current--max">of {max}</span>}
  </>
);

type UtilizationCurrentValueProps = {
  value: string;
  max?: string;
};
