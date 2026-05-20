import {
  createUserTable,
  createEmployeeTable,
  createCustomerTable,
  createSessionTable,
  passwordResetOtps
} from "./userModel.js";

import {
  createIssueCategoryTable,
  createEmployeeIssueCategoryTable,
  createTicketTable,
  createTicketEventTable,
  seedDefaultIssueCategories,
  createAutomatedEmailLogTable
} from "./ticketModel.js";

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
