import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadPdfReport } from "@/lib/export-pdf";

export type ReportPreviewData = {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

export function ReportPreview({ report, onClose }: { report: ReportPreviewData | null; onClose: () => void }) {
  const open = Boolean(report);

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <DialogContent className="max-h-[88vh] max-w-[min(1180px,94vw)] gap-0 overflow-hidden p-0">
        {report ? (
          <>
            <DialogHeader className="border-b border-border px-4 py-3">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <DialogTitle className="text-base">{report.title}</DialogTitle>
                  <DialogDescription className="text-xs">PDF download se pehle data preview</DialogDescription>
                </div>
                <Badge variant="secondary" className="num shrink-0">
                  {report.rows.length.toLocaleString("en-IN")} rows
                </Badge>
              </div>
            </DialogHeader>
            <div className="max-h-[62vh] overflow-auto">
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
            <DialogFooter className="items-center justify-between gap-2 border-t border-border px-4 py-3 sm:flex-row">
              <p className="text-[11px] text-muted-foreground">
                {report.rows.length > 300 ? "Showing first 300 rows here. PDF includes full report." : "PDF will include the rows shown here."}
              </p>
              <Button
                size="sm"
                onClick={() => downloadPdfReport(report.filename, report.title, report.headers, report.rows)}
              >
                <Download className="size-3.5" /> Final Download PDF
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
