const fs = require('fs');
let code = fs.readFileSync('src/modules/students/StudentsTable.tsx', 'utf8');

const startIdx = code.indexOf('<thead style={{ position: "sticky"');
const endIdx = code.indexOf('</table>');

if (startIdx > -1 && endIdx > -1) {
  const partToReplace = code.substring(startIdx, endIdx);
  const replacedPart = partToReplace.replace(/visibleColumns\./g, 'actualVisibleColumns.');
  code = code.substring(0, startIdx) + replacedPart + code.substring(endIdx);
  fs.writeFileSync('src/modules/students/StudentsTable.tsx', code);
  console.log("Successfully replaced visibleColumns. with actualVisibleColumns.");
} else {
  console.log("Failed to find startIdx or endIdx");
}
