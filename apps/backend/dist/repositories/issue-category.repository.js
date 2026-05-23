export class IssueCategoryRepository {
    static async findAllActive(pool) {
        const result = await pool.query(`SELECT id, code, name
       FROM issue_categories
       WHERE is_active = TRUE
       ORDER BY name ASC`);
        return result.rows;
    }
    static async findById(client, id) {
        const result = await client.query(`SELECT id, code, name
       FROM issue_categories
       WHERE id = $1`, [id]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
}
//# sourceMappingURL=issue-category.repository.js.map