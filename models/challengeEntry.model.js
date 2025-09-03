export const ChallengeEntry = {
  async create(db, data) {
    const { id, challenge_id, participant_id, media_url, status } = data;
    const sql = `
      INSERT INTO challenge_entries (id, challenge_id, participant_id, media_url, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [id, challenge_id, participant_id, media_url, status]);
    return { message: "Entry created successfully" };
  },

  async findByChallenge(db, challenge_id) {
    const [rows] = await db.query(
      `SELECT * FROM challenge_entries WHERE challenge_id = ?`,
      [challenge_id]
    );
    return rows;
  },

  async findById(db, id) {
    const [rows] = await db.query(
      `SELECT * FROM challenge_entries WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  async update(db, id, data) {
    const fields = Object.keys(data).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(data);
    await db.query(`UPDATE challenge_entries SET ${fields} WHERE id = ?`, [
      ...values,
      id,
    ]);
    return { message: "Entry updated successfully" };
  },

  async remove(db, id) {
    await db.query(`DELETE FROM challenge_entries WHERE id = ?`, [id]);
    return { message: "Entry deleted successfully" };
  },
};
