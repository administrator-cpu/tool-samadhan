/**
 * Service to handle intelligent ticket assignment based on agent skills and load.
 */

const ACTIVE_TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "ESCALATED"];

/**
 * Finds the best support agent for a given category.
 * 
 * @param {Object} client - Postgres client (for transactions)
 * @param {number} categoryId - The ID of the issue category
 * @returns {Promise<Object|null>} - The assigned agent or null
 */
export const findBestAgentForCategory = async (client, categoryId) => {
  if (!categoryId) return null;

  const result = await client.query(
    `
    WITH active_load AS (
      SELECT
        t.current_assigned_employee_id AS employee_id,
        COUNT(*)::int AS active_count
      FROM tickets t
      WHERE t.status = ANY($1::ticket_status[])
        AND t.current_assigned_employee_id IS NOT NULL
      GROUP BY t.current_assigned_employee_id
    )
    SELECT
      e.id AS employee_id,
      COALESCE(al.active_count, 0) AS active_count
    FROM employees e
    JOIN users u ON u.id = e.user_id
    JOIN employee_issue_categories eic ON eic.employee_id = e.id
    LEFT JOIN active_load al ON al.employee_id = e.id
    WHERE u.role = 'SUPPORT_AGENT'
      AND eic.issue_category_id = $2
    ORDER BY COALESCE(al.active_count, 0) ASC, e.joined_at ASC, e.id ASC
    LIMIT 1
    `,
    [ACTIVE_TICKET_STATUSES, categoryId]
  );

  return result.rows[0] || null;
};
