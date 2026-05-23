const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

replaceFile('src/controllers/user.controller.ts', c => {
  return c.replace(/next\(error\);\n      return;\n    }\n  }\n\n  static async refresh/g, "next(error);\n      return;\n    }\n    return;\n  }\n\n  static async refresh");
});

replaceFile('src/repositories/customer.repository.ts', c => {
  return c.replace(/import \{ Customer \} from '\.\.\/types\/models\.js';\n/, "import { Customer } from '../types/models.js';\nimport { PaginatedResponse } from '../types/dto.js';\n");
});

replaceFile('src/services/email-templates.ts', c => {
  return c
    .replace(/export const baseTemplate = \(\{ title, content \}: any\) => \{/g, "export const baseTemplate = ({ title, content }: { title: any, content: any }) => {")
    .replace(/\[updateType as string\]/g, "[updateType as 'REOPENED' | 'ESCALATED']");
});

replaceFile('src/services/ticket.service.ts', c => {
  return c.replace(/customerId,\n        createdByUserId/g, "customerId: customerId as string,\n        createdByUserId");
});

console.log("Fixes applied");
