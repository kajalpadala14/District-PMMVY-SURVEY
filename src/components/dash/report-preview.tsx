import { Badge } from "@/components/ui/badge";

export type ReportPreviewData = {
  title: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

export function ReportPreview({ report }: { report: ReportPreviewData | null }) {
  if (!report) return null;

  return (
    <section className="mt-4 rounded-md border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{report.title}</p>
          <p className="text-[11px] text-muted-foreground">Preview of selected report</p>
        </div>
        <Badge variant="secondary" className="num">
          {report.rows.length.toLocaleString("en-IN")} rows
        </Badge>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead className="sticky top-0 bg-secondary">
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              {report.headers.map((header) => (
                <th key={header} className="px-2 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.length ? (
              report.rows.slice(0, 300).map((row, rowIndex) => (
                <tr key={`${report.title}-${rowIndex}`} className="border-b border-border/70 hover:bg-secondary/60">
                  {report.headers.map((header, cellIndex) => (
                    <td key={`${header}-${cellIndex}`} className="px-2 py-2">
                      {String(row[cellIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-center text-muted-foreground" colSpan={report.headers.length}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {report.rows.length > 300 ? (
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          Showing first 300 rows. Download Excel/PDF for full report.
        </p>
      ) : null}
    </section>
  );
}
