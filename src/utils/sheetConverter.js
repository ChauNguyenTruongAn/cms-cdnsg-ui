import * as XLSX from "xlsx";

/**
 * Convert a column index (0-based) to Excel letter(s). e.g. 0→A, 25→Z, 26→AA
 */
export const colIndexToLetter = (idx) => {
  let result = "";
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
};

/**
 * Convert (row, col) → "A1" cell address format (0-based inputs).
 */
export const toCellAddress = (row, col) =>
  `${colIndexToLetter(col)}${row + 1}`;

/**
 * Convert a SheetJS workbook → FortuneSheet data array.
 * Each sheet becomes one element in the returned array.
 */
export const transformExcelToLucky = (workbook) => {
  return workbook.SheetNames.map((sheetName, sheetIndex) => {
    const sheet = workbook.Sheets[sheetName];
    const celldata = [];

    // Iterate all cells present in the sheet
    Object.keys(sheet).forEach((cellAddr) => {
      if (cellAddr.startsWith("!")) return; // skip meta keys

      const cell = sheet[cellAddr];
      const match = cellAddr.match(/^([A-Z]+)(\d+)$/);
      if (!match) return;

      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10) - 1; // 0-based
      const colNum = colLetterToIndex(colLetter); // 0-based

      const luckyCell = {
        r: rowNum,
        c: colNum,
        v: {
          v: cell.v ?? null,
          m: cell.w ?? (cell.v != null ? String(cell.v) : ""),
          t: getCellType(cell),
        },
      };

      // Preserve formula
      if (cell.f) luckyCell.v.f = `=${cell.f}`;

      // Preserve number format
      if (cell.z) luckyCell.v.z = cell.z;

      celldata.push(luckyCell);
    });

    // Get sheet range
    const ref = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
    const row = ref ? ref.e.r + 1 : 100;
    const col = ref ? ref.e.c + 1 : 26;

    // Column widths
    const colWidths = (sheet["!cols"] || []).map((c) => ({
      width: c?.wch ? c.wch * 7 : 100,
    }));

    // Row heights
    const rowHeights = (sheet["!rows"] || []).map((r) => ({
      height: r?.hpt ?? 19,
    }));

    return {
      name: sheetName,
      index: sheetIndex,
      status: sheetIndex === 0 ? 1 : 0,
      order: sheetIndex,
      row,
      column: col,
      celldata,
      config: {
        columnlen: colWidths.reduce((acc, w, i) => {
          if (w.width) acc[i] = w.width;
          return acc;
        }, {}),
        rowlen: rowHeights.reduce((acc, h, i) => {
          if (h.height) acc[i] = h.height;
          return acc;
        }, {}),
      },
    };
  });
};

/**
 * Convert FortuneSheet lucky data array → SheetJS workbook.
 */
export const transformLuckyToExcel = (luckyData) => {
  const wb = XLSX.utils.book_new();

  luckyData.forEach((sheet) => {
    const wsData = {};
    let maxRow = 0;
    let maxCol = 0;

    (sheet.celldata || []).forEach((cell) => {
      const { r, c, v } = cell;
      if (v == null || v.v == null) return;

      const addr = XLSX.utils.encode_cell({ r, c });
      const xlsxCell = { v: v.v };

      if (v.t === "n") xlsxCell.t = "n";
      else if (v.t === "b") xlsxCell.t = "b";
      else xlsxCell.t = "s";

      if (v.f) xlsxCell.f = v.f.replace(/^=/, "");
      if (v.z) xlsxCell.z = v.z;

      wsData[addr] = xlsxCell;
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    });

    wsData["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: maxRow, c: maxCol },
    });

    XLSX.utils.book_append_sheet(wb, wsData, sheet.name || `Sheet${sheet.index + 1}`);
  });

  return wb;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const colLetterToIndex = (letters) => {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result - 1;
};

const getCellType = (cell) => {
  if (cell.t === "n") return "n";
  if (cell.t === "b") return "b";
  if (cell.t === "d") return "d";
  return "s";
};
