const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

// 1. ticket.controller.ts -> Add getCategories
replaceFile('src/controllers/ticket.controller.ts', c => {
  if (!c.includes('getCategories')) {
    c = c.replace(
      "import { TicketStatsService } from '../services/ticket-stats.service.js';",
      "import { TicketStatsService } from '../services/ticket-stats.service.js';\nimport { IssueCategoryRepository } from '../repositories/issue-category.repository.js';\nimport { postgresPool } from '../config/database.js';"
    );
    
    const newMethod = `
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await IssueCategoryRepository.findAllActive(postgresPool);
      return sendResponse({ res, data: categories });
    } catch (error) {
      next(error);
    }
  }
`;
    c = c.replace("export class TicketController {\n", "export class TicketController {\n" + newMethod);
  }
  return c;
});

// 2. app.ts -> Mount categories
replaceFile('src/app.ts', c => {
  if (!c.includes('/api/categories')) {
    c = c.replace(
      "app.use('/api', authRoutes);",
      "import { TicketController } from './controllers/ticket.controller.js';\napp.use('/api', authRoutes);\napp.get('/api/categories', TicketController.getCategories);"
    );
  }
  return c;
});

// 3. auth.routes.ts -> Add change password
replaceFile('src/routes/auth.routes.ts', c => {
  if (!c.includes('change-password')) {
    c = c.replace(
      "validateResetPassword",
      "validateResetPassword,\n  validateChangePassword"
    );
    c = c.replace(
      "import { UserController } from '../controllers/user.controller.js';",
      "import { UserController } from '../controllers/user.controller.js';\nimport { requireAuth } from '../middleware/auth.middleware.js';"
    );
    c = c.replace(
      "export default router;",
      "router.post('/change-password', requireAuth, validateChangePassword, UserController.changePassword);\n\nexport default router;"
    );
  }
  return c;
});

// 4. user.routes.ts -> Remove change password
replaceFile('src/routes/user.routes.ts', c => {
  c = c.replace("router.post('/change-password', validateChangePassword, UserController.changePassword);\n", "");
  return c;
});

console.log("Backend fixes applied");
