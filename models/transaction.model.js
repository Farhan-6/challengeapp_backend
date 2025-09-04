export class Transaction {
  static async create(db, txn) {
    await db.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [txn.id, txn.user_id, txn.type, txn.amount, txn.status, txn.reference_id]
    );
    return txn;
  }

  static async findByUser(db, user_id) {
    const [rows] = await db.query("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC", [user_id]);
    return rows;
  }

  static async updateStatus(db, id, status) {
    await db.query("UPDATE transactions SET status = ? WHERE id = ?", [status, id]);
  }
}
