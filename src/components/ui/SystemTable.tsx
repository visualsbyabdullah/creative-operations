import type {
  CSSProperties,
  ReactNode,
  TableHTMLAttributes,
} from "react";

import styles from "./SystemTable.module.css";

type SystemTableProps = Omit<
  TableHTMLAttributes<HTMLTableElement>,
  "style"
> & {
  children: ReactNode;
  columns: number;
  minWidth: number;
  cellWidth?: number;
};

export default function SystemTable({
  children,
  columns,
  minWidth,
  cellWidth = 160,
  className = "",
  ...props
}: SystemTableProps) {
  const style = {
    "--system-table-columns": String(columns),
    "--system-table-min-width": `${minWidth}px`,
    "--system-table-cell-width": `${cellWidth}px`,
  } as CSSProperties;

  return (
    <table
      {...props}
      style={style}
      className={`${styles.table} ${className}`.trim()}
    >
      {children}
    </table>
  );
}