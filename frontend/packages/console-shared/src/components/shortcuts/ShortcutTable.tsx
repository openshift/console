import type { FC, ReactNode } from 'react';

interface ShortcutTableProps {
  children?: ReactNode;
}

export const ShortcutTable: FC<ShortcutTableProps> = ({ children }) => (
  <table>
    <tbody>{children}</tbody>
  </table>
);
