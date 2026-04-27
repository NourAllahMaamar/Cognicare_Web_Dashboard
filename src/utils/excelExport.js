import ExcelJS from 'exceljs';

function triggerDownload(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download an Excel file with just a header row (template). */
export async function exportTemplate(headers, sheetName, filename) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(headers);
  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}

/** Download an Excel file populated with an array of plain objects. */
export async function exportJson(data, sheetName, filename) {
  if (!data.length) return;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(Object.keys(data[0]));
  data.forEach(row => ws.addRow(Object.values(row)));
  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}
