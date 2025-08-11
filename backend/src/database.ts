/**
 * database.ts - SQLite database operations for donation management
 * 
 * This module handles all database operations including:
 * - Database initialization and table creation
 * - CRUD operations for donations
 * - Data validation and error handling
 * - Connection management
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { Donation, CreateDonationInput, UpdateDonationInput } from './types';

// Enable verbose mode for debugging in development
const sqlite = sqlite3.verbose();

// Database file path - stored in backend directory
const DB_PATH = path.join(__dirname, '../donations.db');

/**
 * Database class to encapsulate all SQLite operations
 * Uses singleton pattern to ensure single database connection
 */
class Database {
  private db: sqlite3.Database;
  private static instance: Database;

  private constructor() {
    // Initialize database connection
    this.db = new sqlite.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error connecting to SQLite database:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  /**
   * Get singleton instance of database
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Initialize database tables if they don't exist
   * Creates the donations table with proper schema and constraints
   */
  private async initializeTables(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_name TEXT NOT NULL CHECK(length(donor_name) >= 2),
        donation_type TEXT NOT NULL CHECK(donation_type IN (
          'money', 'food', 'clothing', 'toys', 'books', 'household', 'other'
        )),
        quantity REAL NOT NULL CHECK(quantity > 0),
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ Error creating donations table:', err.message);
          reject(err);
        } else {
          console.log('✅ Donations table initialized');
          
          // Create indexes for better query performance
          this.createIndexes();
          resolve();
        }
      });
    });
  }

  /**
   * Create database indexes for improved query performance
   */
  private createIndexes(): void {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(date)',
      'CREATE INDEX IF NOT EXISTS idx_donations_type ON donations(donation_type)',
      'CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at)'
    ];

    indexes.forEach(indexSQL => {
      this.db.run(indexSQL, (err) => {
        if (err) {
          console.warn('⚠️ Warning: Could not create index:', err.message);
        }
      });
    });
  }

  /**
   * Get all donations from the database
   * Returns donations ordered by creation date (newest first)
   */
  public async getAllDonations(): Promise<Donation[]> {
    const sql = `
      SELECT 
        id,
        donor_name,
        donation_type,
        quantity,
        date,
        created_at,
        updated_at
      FROM donations 
      ORDER BY created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          console.error('❌ Error fetching donations:', err.message);
          reject(new Error('Failed to fetch donations from database'));
        } else {
          console.log(`📊 Retrieved ${rows.length} donations`);
          resolve(rows as Donation[]);
        }
      });
    });
  }

  /**
   * Create a new donation record
   * @param donation - Donation data to insert
   * @returns Promise resolving to the created donation with ID
   */
  public async createDonation(donation: CreateDonationInput): Promise<Donation> {
    const { donor_name, donation_type, quantity, date } = donation;
    
    const sql = `
      INSERT INTO donations (donor_name, donation_type, quantity, date)
      VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [donor_name, donation_type, quantity, date], function(err) {
        if (err) {
          console.error('❌ Error creating donation:', err.message);
          reject(new Error('Failed to create donation'));
        } else {
          console.log(`✅ Created donation with ID: ${this.lastID}`);
          
          // Fetch and return the created donation
          const selectSQL = 'SELECT * FROM donations WHERE id = ?';
          Database.instance.db.get(selectSQL, [this.lastID], (selectErr, row: any) => {
            if (selectErr) {
              reject(new Error('Failed to retrieve created donation'));
            } else {
              resolve(row as Donation);
            }
          });
        }
      });
    });
  }

  /**
   * Update an existing donation
   * @param id - Donation ID to update
   * @param updates - Fields to update
   * @returns Promise resolving to updated donation or null if not found
   */
  public async updateDonation(id: number, updates: UpdateDonationInput): Promise<Donation | null> {
    // Build dynamic SQL based on provided fields
    const fields = Object.keys(updates).filter(key => updates[key as keyof UpdateDonationInput] !== undefined);
    
    if (fields.length === 0) {
      throw new Error('No fields provided for update');
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof UpdateDonationInput]);
    
    const sql = `
      UPDATE donations 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [...values, id], function(err) {
        if (err) {
          console.error('❌ Error updating donation:', err.message);
          reject(new Error('Failed to update donation'));
        } else if (this.changes === 0) {
          console.log(`⚠️ No donation found with ID: ${id}`);
          resolve(null);
        } else {
          console.log(`✅ Updated donation ID: ${id}`);
          
          // Fetch and return the updated donation
          const selectSQL = 'SELECT * FROM donations WHERE id = ?';
          Database.instance.db.get(selectSQL, [id], (selectErr, row: any) => {
            if (selectErr) {
              reject(new Error('Failed to retrieve updated donation'));
            } else {
              resolve(row as Donation);
            }
          });
        }
      });
    });
  }

  /**
   * Delete a donation by ID
   * @param id - Donation ID to delete
   * @returns Promise resolving to boolean indicating success
   */
  public async deleteDonation(id: number): Promise<boolean> {
    const sql = 'DELETE FROM donations WHERE id = ?';

    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('❌ Error deleting donation:', err.message);
          reject(new Error('Failed to delete donation'));
        } else if (this.changes === 0) {
          console.log(`⚠️ No donation found with ID: ${id}`);
          resolve(false);
        } else {
          console.log(`✅ Deleted donation ID: ${id}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Get a single donation by ID
   * @param id - Donation ID to retrieve
   * @returns Promise resolving to donation or null if not found
   */
  public async getDonationById(id: number): Promise<Donation | null> {
    const sql = 'SELECT * FROM donations WHERE id = ?';

    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          console.error('❌ Error fetching donation:', err.message);
          reject(new Error('Failed to fetch donation'));
        } else {
          resolve(row ? row as Donation : null);
        }
      });
    });
  }

  /**
   * Close database connection gracefully
   */
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
        resolve();
      });
    });
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});