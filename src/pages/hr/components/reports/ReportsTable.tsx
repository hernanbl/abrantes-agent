
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewReport } from "./types";
import { StatusBadge } from "@/pages/supervisor/components/StatusBadge";

interface ReportTableProps {
  reportData: ReviewReport[];
  showReport: boolean;
}

export function ReportTable({ reportData, showReport }: ReportTableProps) {
  if (!showReport || reportData.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empleado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Departamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.slice(0, 5).map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{row.employee_name}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>{row.department}</TableCell>
            </TableRow>
          ))}
          {reportData.length > 5 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {`Mostrando 5 de ${reportData.length} registros. Exporta para ver todos.`}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
