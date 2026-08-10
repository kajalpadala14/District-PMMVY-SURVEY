type CellValue = string | number | null | undefined;

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 36;
const LINE_HEIGHT = 12;
const FONT_SIZE = 8;
const MAX_CHARS_PER_LINE = 150;

export function downloadPdfReport(filename: string, title: string, headers: string[], rows: CellValue[][]) {
  const lines = buildLines(title, headers, rows);
  const pageLineCount = Math.floor((PAGE_HEIGHT - MARGIN * 2 - 22) / LINE_HEIGHT);
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += pageLineCount) {
    pages.push(lines.slice(index, index + pageLineCount));
  }

  const pdf = createPdf(title, pages.length ? pages : [["No records found."]]);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function buildLines(title: string, headers: string[], rows: CellValue[][]) {
  const lines = [
    title,
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    `Records: ${rows.length}`,
    "",
    headers.join(" | "),
    "-".repeat(Math.min(MAX_CHARS_PER_LINE, headers.join(" | ").length)),
  ];

  rows.forEach((row) => {
    const line = row.map(formatCell).join(" | ");
    splitLine(line).forEach((part) => lines.push(part));
  });

  return lines;
}

function formatCell(value: CellValue) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLine(value: string) {
  const text = toPdfSafeText(value);
  if (text.length <= MAX_CHARS_PER_LINE) return [text];

  const parts: string[] = [];
  for (let index = 0; index < text.length; index += MAX_CHARS_PER_LINE) {
    parts.push(text.slice(index, index + MAX_CHARS_PER_LINE));
  }
  return parts;
}

function createPdf(title: string, pages: string[][]) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageObjectStart = 3;
  const contentObjectStart = pageObjectStart + pages.length;
  const pageRefs = pages.map((_, index) => `${pageObjectStart + index} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);

  pages.forEach((_, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectStart + index} 0 R >>`,
    );
  });

  pages.forEach((lines, pageIndex) => {
    const content = buildPageContent(title, lines, pageIndex + 1, pages.length);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  return assemblePdf(objects);
}

function buildPageContent(title: string, lines: string[], pageNumber: number, pageCount: number) {
  const commands = [
    "BT",
    `/F1 ${FONT_SIZE} Tf`,
    `${MARGIN} ${PAGE_HEIGHT - MARGIN} Td`,
    `(${escapePdfText(toPdfSafeText(title))}) Tj`,
    `0 -${LINE_HEIGHT + 4} Td`,
  ];

  lines.forEach((line) => {
    commands.push(`(${escapePdfText(toPdfSafeText(line))}) Tj`);
    commands.push(`0 -${LINE_HEIGHT} Td`);
  });

  commands.push("ET");
  commands.push("BT");
  commands.push(`/F1 ${FONT_SIZE} Tf`);
  commands.push(`${PAGE_WIDTH - MARGIN - 90} ${MARGIN / 2} Td`);
  commands.push(`(Page ${pageNumber} of ${pageCount}) Tj`);
  commands.push("ET");
  return commands.join("\n");
}

function assemblePdf(objects: string[]) {
  let output = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = output.length;
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return output;
}

function toPdfSafeText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
