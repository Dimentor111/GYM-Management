/**
 * SQLite schema. Identical to the original single-file build so exported `.db`
 * files stay fully compatible in both directions.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY AUTOINCREMENT,fname TEXT,lname TEXT,phone TEXT,email TEXT,dob TEXT,notes TEXT,status TEXT DEFAULT 'active',created_at TEXT,updated_at TEXT);
CREATE TABLE IF NOT EXISTS membership_plans(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,price REAL NOT NULL,duration_days INTEGER NOT NULL DEFAULT 30,total_visits INTEGER DEFAULT 0,max_visits_day INTEGER DEFAULT 1,description TEXT,color TEXT DEFAULT 'purple',can_freeze INTEGER DEFAULT 0,can_renew INTEGER DEFAULT 1,active INTEGER DEFAULT 1,show_pos INTEGER DEFAULT 1,created_at TEXT);
CREATE TABLE IF NOT EXISTS memberships(id INTEGER PRIMARY KEY AUTOINCREMENT,client_id INTEGER,plan_id INTEGER,plan_name TEXT,client_name TEXT,price REAL,start_date TEXT,end_date TEXT,total_visits INTEGER DEFAULT 0,visits_used INTEGER DEFAULT 0,status TEXT DEFAULT 'active',payment_method TEXT,staff_name TEXT,sale_id INTEGER,notes TEXT,created_at TEXT,updated_at TEXT);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,category TEXT NOT NULL,sale_price REAL NOT NULL,cost_price REAL DEFAULT 0,stock INTEGER DEFAULT 0,min_stock INTEGER DEFAULT 5,description TEXT,active INTEGER DEFAULT 1,show_pos INTEGER DEFAULT 1,track_stock INTEGER DEFAULT 0,created_at TEXT);
CREATE TABLE IF NOT EXISTS sales(id INTEGER PRIMARY KEY AUTOINCREMENT,client_id INTEGER,client_name TEXT,total REAL NOT NULL,discount REAL DEFAULT 0,discount_type TEXT DEFAULT 'pct',final_total REAL NOT NULL,payment_method TEXT NOT NULL,staff_name TEXT,status TEXT DEFAULT 'completed',notes TEXT,sale_date TEXT,sale_time TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS sale_items(id INTEGER PRIMARY KEY AUTOINCREMENT,sale_id INTEGER,product_id INTEGER,product_name TEXT,category TEXT,qty INTEGER,unit_price REAL,total REAL,item_type TEXT,ref_id INTEGER);
CREATE TABLE IF NOT EXISTS visits(id INTEGER PRIMARY KEY AUTOINCREMENT,client_id INTEGER,client_name TEXT,membership_id INTEGER,visit_type TEXT DEFAULT 'membership',visit_date TEXT,visit_time TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS stock_movements(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,product_name TEXT,type TEXT,qty INTEGER,notes TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS staff(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,role TEXT NOT NULL,phone TEXT,email TEXT,active INTEGER DEFAULT 1,created_at TEXT);
CREATE TABLE IF NOT EXISTS activity_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_name TEXT,action TEXT,details TEXT,created_at TEXT);
`;
