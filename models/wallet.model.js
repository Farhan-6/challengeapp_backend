export class Wallet {
  static async findByUser(db, user_id) {
    const [rows] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [user_id]);
    return rows[0] || null;
  }

  static async create(db, user_id) {
    await db.query("INSERT INTO wallets (user_id, balance) VALUES (?, ?)", [user_id, 0.00]);
    return { user_id, balance: 0.00 };
  }

  static async updateBalance(db, user_id, newBalance) {
    await db.query(
      "UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [newBalance, user_id]
    );
  }
}
