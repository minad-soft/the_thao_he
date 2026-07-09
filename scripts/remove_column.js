const fs = require('fs');
let code = fs.readFileSync('src/modules/students/StudentsTable.tsx', 'utf8');

// Remove <th>
code = code.replace('<th style={{ textAlign: "right" }}>Thao tác</th>', '');

// Remove <td>
const startStr = '<td data-label="Thao tác" style={{ textAlign: "right", position: "relative" }}>';
const startIdx = code.indexOf(startStr);
if (startIdx > -1) {
  let endIdx = startIdx;
  let tagCount = 1; // we matched the first <td>
  // Simple HTML matching to find closing </td>
  const searchStr = code.substring(startIdx + startStr.length);
  const tdOpenMatches = [...searchStr.matchAll(/<td/g)];
  const tdCloseMatches = [...searchStr.matchAll(/<\/td>/g)];
  
  // Actually, we just need to find the matching </td>. 
  // Since we know there are no nested <td/>, we can just find the first </td>
  const nextCloseIdx = searchStr.indexOf('</td>');
  if (nextCloseIdx > -1) {
    endIdx = startIdx + startStr.length + nextCloseIdx + '</td>'.length;
    code = code.substring(0, startIdx) + code.substring(endIdx);
  }
}

fs.writeFileSync('src/modules/students/StudentsTable.tsx', code);
console.log("Successfully removed Thao tac column.");
