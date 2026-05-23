const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

replaceFile('src/controllers/ticket.controller.ts', c => {
  return c
    .replace(/req\.params\.id/g, "(req.params.id as string)")
    .replace(/updateRca\(/g, "updateTicketRca(")
    .replace(/updateStatus\(/g, "updateTicketStatus(");
});

replaceFile('src/controllers/user.controller.ts', c => {
  return c
    .replace(/req\.params\.id/g, "(req.params.id as string)");
});

replaceFile('src/repositories/customer.repository.ts', c => {
  return c.replace(/import \{ PaginatedResponse \} from '\.\.\/types\/models\.js';\n/, "");
});

replaceFile('src/services/email-templates.ts', c => {
  return c
    .replace(/export const baseTemplate = \(\{ title, content \}\) => \{/g, "export const baseTemplate = ({ title, content }: any) => {")
    .replace(/\[updateType\]/g, "[updateType as string]");
});

replaceFile('src/services/ticket.service.ts', c => {
  return c.replace(/circuitDescription: \(dto\.circuitDescription \|\| ''\) as string/g, "circuitDescription: dto.circuitDescription ? String(dto.circuitDescription) : ''");
});

console.log("Fixes applied");
