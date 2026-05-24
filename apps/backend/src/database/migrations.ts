import {
  createUserTable,
  createEmployeeTable,
  createCustomerTable,
  createSessionTable,
  passwordResetOtps
} from './schemas/user.schema.js';

import {
  createIssueCategoryTable,
  createEmployeeIssueCategoryTable,
  createTicketTable,
  createTicketEventTable,
  seedDefaultIssueCategories,
  createAutomatedEmailLogTable
} from './schemas/ticket.schema.js';

export const createDatabaseTables = async () => {
  await createUserTable();
  await createEmployeeTable();
  await createCustomerTable();
  await createIssueCategoryTable();
  await createEmployeeIssueCategoryTable();
  await createTicketTable();
  await createTicketEventTable();
  await createSessionTable();
  await seedDefaultIssueCategories();
  await passwordResetOtps();
  await createAutomatedEmailLogTable();
};
