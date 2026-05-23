const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

// 1. types/dto.ts -> remove missing UserRole errors
replaceFile('src/types/dto.ts', c => c.replace("export { UserRole, TicketStatus } from './enums.js';", "import { UserRole, TicketStatus } from './enums.js';\nexport { UserRole, TicketStatus };"));

// 2. controllers/ticket.controller.ts
replaceFile('src/controllers/ticket.controller.ts', c => {
  return c
    .replace(/req\.query\.page as string/g, "req.query.page as unknown as string")
    .replace(/req\.query\.limit as string/g, "req.query.limit as unknown as string")
    .replace(/req\.query\.ownership as string/g, "req.query.ownership as unknown as string")
    .replace(/req\.query\.agentId as string/g, "req.query.agentId as unknown as string")
    .replace(/req\.query\.statusGroup as string/g, "req.query.statusGroup as unknown as string")
    .replace(/req\.query\.afterEventId as string/g, "req.query.afterEventId as unknown as string")
    .replace(/updateTicketStatus/g, "updateStatus")
    .replace(/updateTicketRca/g, "updateRca");
});

// 3. controllers/user.controller.ts
replaceFile('src/controllers/user.controller.ts', c => {
  return c
    .replace(/req\.query\.page as string/g, "req.query.page as unknown as string")
    .replace(/req\.query\.limit as string/g, "req.query.limit as unknown as string")
    .replace(/next\(error\);\n    }\n  }/g, "next(error);\n      return;\n    }\n  }");
});

// 4. routes/ticket.routes.ts
replaceFile('src/routes/ticket.routes.ts', c => {
  return c
    .replace(/, UserRole\.MANAGER/g, "")
    .replace(/TicketController\.updateTicketStatus/g, "TicketController.updateStatus")
    .replace(/TicketController\.updateTicketRca/g, "TicketController.updateRca");
});

// 5. routes/user.routes.ts
replaceFile('src/routes/user.routes.ts', c => {
  return c.replace(/, UserRole\.MANAGER/g, "");
});

// 6. repositories
replaceFile('src/repositories/customer.repository.ts', c => c.replace(/import \{ Customer \} from '\.\.\/types\/models\.js';/, "import { Customer } from '../types/models.js';\nimport { PaginatedResponse } from '../types/dto.js';"));
replaceFile('src/repositories/ticket.repository.ts', c => c.replace(/import \{ Ticket, TicketStatus \}/, "import { Ticket } from '../types/models.js';\nimport { TicketStatus } from '../types/enums.js';\n//"));
replaceFile('src/repositories/user.repository.ts', c => c.replace(/import \{ User, UserRole \}/, "import { User } from '../types/models.js';\nimport { UserRole } from '../types/enums.js';\n//"));

// 7. services/auth.service.ts
replaceFile('src/services/auth.service.ts', c => c.replace(/argon2\.verify\(user\.password, dto\.password\)/, "argon2.verify(user.password, dto.password || '')"));

// 8. services/user.service.ts
replaceFile('src/services/user.service.ts', c => {
  return c
    .replace(/dto\.issueCategories\?\.length > 0/g, "(dto.issueCategories && dto.issueCategories.length > 0)")
    .replace(/replaceCategoriesByName\(client, employee\.id, dto\.issueCategories\)/g, "replaceCategoriesByName(client, employee.id, dto.issueCategories || [])")
    .replace(/argon2\.verify\(userWithPass\.rows\[0\]\.password, dto\.currentPassword\)/, "argon2.verify(userWithPass.rows[0].password, dto.currentPassword || '')")
    .replace(/argon2\.hash\(dto\.newPassword\)/, "argon2.hash(dto.newPassword || '')");
});

// 9. middleware/error-handler.ts
replaceFile('src/middleware/error-handler.middleware.ts', c => c.replace(/res\.status\(statusCode\)\.json\(/, "return res.status(statusCode).json("));

// 10. email-templates.ts
replaceFile('src/services/email-templates.ts', c => c.replace(/const template = \(statusTemplates as any\)/, "const template: any = (statusTemplates as any)"));

// 11. ticket.service.ts
replaceFile('src/services/ticket.service.ts', c => c.replace(/circuitDescription: dto\.circuitDescription as string/g, "circuitDescription: (dto.circuitDescription || '') as string"));

console.log("Fixes applied");
