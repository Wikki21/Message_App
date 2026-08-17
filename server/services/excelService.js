import XLSX from "xlsx";


export function readExcelFile(filePath) {

  if (!filePath) {

    throw new Error(
      "Excel file path is required"
    );

  }


  const workbook =
    XLSX.readFile(
      filePath
    );


  const sheetName =
    workbook.SheetNames[0];


  if (!sheetName) {

    throw new Error(
      "No worksheet found"
    );

  }


  const worksheet =
    workbook.Sheets[
      sheetName
    ];


  return XLSX.utils.sheet_to_json(
    worksheet,
    {
      defval: ""
    }
  );

}