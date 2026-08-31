class DatasetRepository {
  constructor(pool) { this.pool = pool; }

  async findActive() {
    const [rows] = await this.pool.execute(
      `SELECT d.id, d.original_filename AS originalFileName, d.stored_filename AS storedFileName,
              d.json_filename AS jsonFileName, d.sha256, d.record_count AS recordCount,
              d.imported_at AS importedAt, d.imported_by AS importedBy, u.email AS importedByEmail
       FROM datasets d JOIN users u ON u.id = d.imported_by
       WHERE d.is_active = 1 ORDER BY d.imported_at DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async activate(metadata) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("UPDATE datasets SET is_active = 0 WHERE is_active = 1");
      await connection.execute(
        `INSERT INTO datasets
          (id, original_filename, stored_filename, json_filename, sha256, record_count, imported_by, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [metadata.id, metadata.originalFileName, metadata.storedFileName, metadata.jsonFileName,
          metadata.sha256, metadata.recordCount, metadata.importedBy]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return this.findActive();
  }
}

module.exports = { DatasetRepository };
