import type { FC, ReactNode } from 'react';

interface ShortcutTableProps {
  children?: ReactNode;
}

const ShortcutTable: FC<ShortcutTableProps> = ({ children }) => (
  <table>
    <tbody>{children}</tbody>
  </table>
);

export default ShortcutTable;
