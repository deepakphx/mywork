import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREATE_PROJECTS_TABLE = `
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(255),
  client_name VARCHAR(255),
  status ENUM('active','completed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
`;

const CREATE_WORK_LOGS_TABLE = `
CREATE TABLE IF NOT EXISTS work_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  work_date DATE,
  work_title VARCHAR(255),
  description TEXT,
  hours DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB;
`;

const CREATE_ADMIN_TABLE = `
CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
`;

const CREATE_SERVER_CREDENTIALS_TABLE = `
CREATE TABLE IF NOT EXISTS server_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  database_name VARCHAR(255) NOT NULL,
  port INT NOT NULL DEFAULT 3306,
  encrypted_secret TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
`;

const CREATE_SECURITY_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS security_settings (
  id INT PRIMARY KEY,
  reveal_password_hash VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
`;

export async function POST() {
  try {
    await pool.query(CREATE_PROJECTS_TABLE);
    await pool.query(CREATE_WORK_LOGS_TABLE);
    await pool.query(CREATE_ADMIN_TABLE);
    await pool.query(CREATE_SERVER_CREDENTIALS_TABLE);
    await pool.query(CREATE_SECURITY_SETTINGS_TABLE);
    await pool.query("INSERT IGNORE INTO security_settings (id, reveal_password_hash) VALUES (1, NULL)");

    return NextResponse.json({
      ok: true,
      message: "Tables created successfully (or already existed), including security tables.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
