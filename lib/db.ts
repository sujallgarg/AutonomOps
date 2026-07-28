import { Pool } from 'pg';
import { Lead, StructuredExecutionLog } from '@/types/agent';

const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();

let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });
}

// In-Memory Fallback Cache when DATABASE_URL is not configured
let inMemoryLeads: Lead[] = [];
let inMemoryServices = [
  {
    id: 'cs_1',
    name: '💻 Full-Stack Web & Mobile App Development',
    desc: 'End-to-end React, Next.js, Node.js & React Native app engineering',
    baseFee: 350,
    hourlyRate: 145
  },
  {
    id: 'cs_2',
    name: '⚡ Backend Microservices & API Architecture',
    desc: 'High-performance REST/GraphQL APIs, Postgres, Redis & Docker setup',
    baseFee: 300,
    hourlyRate: 135
  },
  {
    id: 'cs_3',
    name: '🤖 AI Agent & LLM Integration',
    desc: 'OpenAI, Google Gemini API, RAG workflows & custom AI chatbots',
    baseFee: 400,
    hourlyRate: 160
  }
];

// Initialize DB schema automatically
export async function initDb() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        zip_code VARCHAR(50),
        industry_category VARCHAR(255),
        project_type VARCHAR(255),
        preferred_timeline VARCHAR(255),
        scope TEXT,
        dispatch_path VARCHAR(100),
        status VARCHAR(100),
        pricing_breakdown JSONB,
        safety_flags JSONB,
        calendar_slot VARCHAR(255),
        assigned_owner_name VARCHAR(255),
        assigned_owner_email VARCHAR(255),
        assigned_owner_phone VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_owner_name VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_owner_email VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_owner_phone VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_timeline VARCHAR(255);

      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        desc_text TEXT,
        base_fee NUMERIC(10, 2),
        hourly_rate NUMERIC(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_premium BOOLEAN DEFAULT TRUE,
        free_trial_expires_at TIMESTAMP,
        total_earnings NUMERIC(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS business_owners (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        specialty VARCHAR(255) DEFAULT 'Full-Stack Web & AI Architecture',
        status VARCHAR(50) DEFAULT 'active',
        verification_status VARCHAR(50) DEFAULT 'verified',
        is_premium BOOLEAN DEFAULT TRUE,
        free_trial_expires_at TIMESTAMP,
        total_match_fees NUMERIC(10, 2) DEFAULT 0.00,
        total_deposit_earnings NUMERIC(10, 2) DEFAULT 0.00,
        total_approved_orders INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE IF EXISTS websites DROP CONSTRAINT IF EXISTS websites_user_id_fkey;
      ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'client';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS free_trial_expires_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10, 2) DEFAULT 0.00;

      ALTER TABLE services ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);

      ALTER TABLE business_owners ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT TRUE;
      ALTER TABLE business_owners ADD COLUMN IF NOT EXISTS free_trial_expires_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'SUCCESS',
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('PostgreSQL Schema Init Warning:', err);
  }
}

// Ensure schema exists on module load
initDb();

// ----------------- LEADS CRUD OPERATIONS -----------------

export async function getAllLeadsFromDb(): Promise<Lead[]> {
  if (!pool) {
    return inMemoryLeads;
  }

  try {
    const res = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    return res.rows.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      zip_code: row.zip_code,
      industry_category: row.industry_category,
      project_type: row.project_type,
      preferred_timeline: row.preferred_timeline,
      scope: row.scope,
      dispatch_path: row.dispatch_path,
      status: row.status,
      pricing_breakdown: row.pricing_breakdown,
      safety_flags: row.safety_flags || [],
      calendar_slot: row.calendar_slot,
      assigned_owner_name: row.assigned_owner_name,
      assigned_owner_email: row.assigned_owner_email,
      assigned_owner_phone: row.assigned_owner_phone,
      created_at: row.created_at
    }));
  } catch (err) {
    console.error('PostgreSQL getAllLeads Error:', err);
    return inMemoryLeads;
  }
}

export async function saveLeadToDb(lead: Lead): Promise<Lead> {
  const existingIdx = inMemoryLeads.findIndex((l) => l.id === lead.id);
  if (existingIdx >= 0) {
    inMemoryLeads[existingIdx] = lead;
  } else {
    inMemoryLeads.unshift(lead);
  }

  if (!pool) return lead;

  try {
    await pool.query(
      `INSERT INTO leads (
        id, customer_id, full_name, email, phone, zip_code, industry_category, 
        project_type, preferred_timeline, scope, dispatch_path, status, 
        pricing_breakdown, safety_flags, calendar_slot, assigned_owner_name,
        assigned_owner_email, assigned_owner_phone, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (id) DO UPDATE SET 
        status = EXCLUDED.status,
        preferred_timeline = EXCLUDED.preferred_timeline,
        pricing_breakdown = EXCLUDED.pricing_breakdown,
        assigned_owner_name = EXCLUDED.assigned_owner_name,
        assigned_owner_email = EXCLUDED.assigned_owner_email,
        assigned_owner_phone = EXCLUDED.assigned_owner_phone,
        calendar_slot = EXCLUDED.calendar_slot`,
      [
        lead.id,
        lead.customer_id,
        lead.full_name,
        lead.email,
        lead.phone,
        lead.zip_code,
        lead.industry_category,
        lead.project_type,
        lead.preferred_timeline,
        lead.scope,
        lead.dispatch_path,
        lead.status,
        JSON.stringify(lead.pricing_breakdown || {}),
        JSON.stringify(lead.safety_flags || []),
        lead.calendar_slot || '',
        lead.assigned_owner_name || 'Sujal Garg',
        lead.assigned_owner_email || 'sujal@autonomops.io',
        lead.assigned_owner_phone || '+1 (555) 019-9922'
      ]
    );
  } catch (err) {
    console.error('PostgreSQL saveLead Error:', err);
  }

  return lead;
}

export async function updateLeadStatusInDb(leadId: string, status: string, preferred_timeline?: string): Promise<boolean> {
  const existing = inMemoryLeads.find((l) => l.id === leadId);
  if (existing) {
    existing.status = status as any;
    if (preferred_timeline) {
      existing.preferred_timeline = preferred_timeline;
    }
  }

  if (!pool) return true;

  try {
    if (preferred_timeline) {
      await pool.query('UPDATE leads SET status = $1, preferred_timeline = $2 WHERE id = $3', [status, preferred_timeline, leadId]);
    } else {
      await pool.query('UPDATE leads SET status = $1 WHERE id = $2', [status, leadId]);
    }
    return true;
  } catch (err) {
    console.error('PostgreSQL updateLeadStatus Error:', err);
    return false;
  }
}

// ----------------- SERVICES CRUD OPERATIONS -----------------

export interface DbService {
  id: string;
  name: string;
  desc: string;
  baseFee: number;
  hourlyRate: number;
  ownerEmail?: string;
  created_at?: string;
}

export async function getServicesFromDb(): Promise<DbService[]> {
  if (!pool) return inMemoryServices;

  try {
    const res = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    if (res.rows.length === 0) return inMemoryServices;
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      desc: row.desc_text,
      baseFee: Number(row.base_fee),
      hourlyRate: Number(row.hourly_rate),
      ownerEmail: row.owner_email || '',
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err) {
    console.error('PostgreSQL getServices Error:', err);
    return inMemoryServices;
  }
}

export async function addServiceToDb(service: { id: string; name: string; desc: string; baseFee: number; hourlyRate: number; ownerEmail?: string }): Promise<DbService> {
  const serviceObj: DbService = {
    ...service,
    ownerEmail: service.ownerEmail || ''
  };

  const existingIndex = inMemoryServices.findIndex((s) => s.id === service.id);
  if (existingIndex >= 0) {
    inMemoryServices[existingIndex] = serviceObj;
  } else {
    inMemoryServices.unshift(serviceObj);
  }

  if (!pool) return serviceObj;

  try {
    await pool.query(
      `INSERT INTO services (id, name, desc_text, base_fee, hourly_rate, owner_email, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         desc_text = EXCLUDED.desc_text,
         base_fee = EXCLUDED.base_fee,
         hourly_rate = EXCLUDED.hourly_rate,
         owner_email = EXCLUDED.owner_email;`,
      [serviceObj.id, serviceObj.name, serviceObj.desc, serviceObj.baseFee, serviceObj.hourlyRate, serviceObj.ownerEmail]
    );
  } catch (err) {
    console.error('PostgreSQL addService Error:', err);
  }
  return serviceObj;
}

export async function deleteServiceFromDb(id: string) {
  inMemoryServices = inMemoryServices.filter((s) => s.id !== id);
  if (!pool) return true;

  try {
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    return true;
  } catch (err) {
    console.error('PostgreSQL deleteService Error:', err);
    return false;
  }
}

// ----------------- USERS & EARNINGS DATABASE OPERATIONS -----------------

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'owner';
  is_premium: boolean;
  free_trial_expires_at: string | null;
  total_earnings: number;
  created_at: string;
}

let inMemoryUsers: DbUser[] = [];

export async function getAllUsersFromDb(): Promise<DbUser[]> {
  if (!pool) return inMemoryUsers;

  try {
    const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    if (res.rows.length === 0) return inMemoryUsers;

    return res.rows.map((row) => {
      const isPremium = Boolean(row.is_premium);
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        is_premium: isPremium,
        free_trial_expires_at: isPremium ? null : (row.free_trial_expires_at ? new Date(row.free_trial_expires_at).toISOString() : new Date(Date.now() + 15 * 86400000).toISOString()),
        total_earnings: Number(row.total_earnings || 0),
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
      };
    });
  } catch (err) {
    console.error('PostgreSQL getAllUsers Error:', err);
    return inMemoryUsers;
  }
}

export async function saveOrUpdateUserInDb(user: {
  name: string;
  email: string;
  role: 'client' | 'owner';
  is_premium?: boolean;
}): Promise<DbUser> {
  const existingUser = inMemoryUsers.find((u) => u.email === user.email);
  const isPremium = user.is_premium !== undefined ? user.is_premium : (existingUser ? existingUser.is_premium : false);
  const trialExpires = new Date();
  trialExpires.setDate(trialExpires.getDate() + 15);

  const userObj: DbUser = {
    id: `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: user.name,
    email: user.email,
    role: user.role,
    is_premium: isPremium,
    free_trial_expires_at: isPremium ? null : trialExpires.toISOString(),
    total_earnings: 0.00,
    created_at: new Date().toISOString()
  };

  const existingIndex = inMemoryUsers.findIndex((u) => u.email === user.email);
  if (existingIndex >= 0) {
    inMemoryUsers[existingIndex] = {
      ...inMemoryUsers[existingIndex],
      ...userObj,
      is_premium: isPremium,
      free_trial_expires_at: isPremium ? null : (inMemoryUsers[existingIndex].free_trial_expires_at || trialExpires.toISOString())
    };
  } else {
    inMemoryUsers.unshift(userObj);
  }

  if (!pool) return userObj;

  try {
    const res = await pool.query(
      `INSERT INTO users (id, name, email, role, is_premium, free_trial_expires_at, total_earnings, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         is_premium = EXCLUDED.is_premium,
         free_trial_expires_at = CASE WHEN EXCLUDED.is_premium = TRUE THEN NULL ELSE users.free_trial_expires_at END
       RETURNING *;`,
      [userObj.id, userObj.name, userObj.email, userObj.role, isPremium, isPremium ? null : trialExpires, userObj.total_earnings]
    );

    const row = res.rows[0];
    const rowIsPremium = Boolean(row.is_premium);
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      role: row.role,
      is_premium: rowIsPremium,
      free_trial_expires_at: rowIsPremium ? null : (row.free_trial_expires_at ? new Date(row.free_trial_expires_at).toISOString() : new Date().toISOString()),
      total_earnings: Number(row.total_earnings || 0),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };
  } catch (err) {
    try {
      const fallbackRes = await pool.query(
        `INSERT INTO users (name, email, role, is_premium, free_trial_expires_at, total_earnings, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           is_premium = EXCLUDED.is_premium,
           free_trial_expires_at = CASE WHEN EXCLUDED.is_premium = TRUE THEN NULL ELSE users.free_trial_expires_at END
         RETURNING *;`,
        [userObj.name, userObj.email, userObj.role, isPremium, isPremium ? null : trialExpires, userObj.total_earnings]
      );
      const row = fallbackRes.rows[0];
      const rowIsPremium = Boolean(row.is_premium);
      return {
        id: String(row.id),
        name: row.name,
        email: row.email,
        role: row.role,
        is_premium: rowIsPremium,
        free_trial_expires_at: rowIsPremium ? null : (row.free_trial_expires_at ? new Date(row.free_trial_expires_at).toISOString() : new Date().toISOString()),
        total_earnings: Number(row.total_earnings || 0),
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
      };
    } catch (fallbackErr) {
      console.error('PostgreSQL saveOrUpdateUser Error:', fallbackErr);
      return userObj;
    }
  }
}

// ----------------- DEDICATED BUSINESS OWNERS DATABASE OPERATIONS -----------------

export interface DbBusinessOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
  verification_status: string;
  is_premium: boolean;
  free_trial_expires_at: string | null;
  total_match_fees: number;
  total_deposit_earnings: number;
  total_approved_orders: number;
  created_at: string;
}

let inMemoryBusinessOwners: DbBusinessOwner[] = [];

export async function getAllBusinessOwnersFromDb(): Promise<DbBusinessOwner[]> {
  if (!pool) return inMemoryBusinessOwners;

  try {
    const res = await pool.query('SELECT * FROM business_owners ORDER BY created_at DESC');
    let userOwnersRes: any = { rows: [] };
    try {
      userOwnersRes = await pool.query("SELECT * FROM users WHERE role = 'owner' ORDER BY created_at DESC");
    } catch (e) {
      console.warn('Could not query users table for owners:', e);
    }

    const map = new Map<string, DbBusinessOwner>();

    res.rows.forEach((row) => {
      const isPremium = Boolean(row.is_premium);
      map.set(row.email.toLowerCase(), {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        specialty: row.specialty || 'Full-Stack Web & AI Architecture',
        status: row.status || 'active',
        verification_status: row.verification_status || 'verified',
        is_premium: isPremium,
        free_trial_expires_at: isPremium ? null : (row.free_trial_expires_at ? new Date(row.free_trial_expires_at).toISOString() : new Date(Date.now() + 15 * 86400000).toISOString()),
        total_match_fees: Number(row.total_match_fees || 0),
        total_deposit_earnings: Number(row.total_deposit_earnings || 0),
        total_approved_orders: Number(row.total_approved_orders || 0),
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
      });
    });

    userOwnersRes.rows.forEach((row: any) => {
      if (!map.has(row.email.toLowerCase())) {
        const isPremium = Boolean(row.is_premium);
        map.set(row.email.toLowerCase(), {
          id: `owner_${row.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: row.name,
          email: row.email,
          phone: '',
          specialty: 'Full-Stack Web & AI Architecture',
          status: 'active',
          verification_status: 'verified',
          is_premium: isPremium,
          free_trial_expires_at: isPremium ? null : (row.free_trial_expires_at ? new Date(row.free_trial_expires_at).toISOString() : new Date(Date.now() + 15 * 86400000).toISOString()),
          total_match_fees: Number(row.total_earnings || 0),
          total_deposit_earnings: 0.00,
          total_approved_orders: 0,
          created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
        });
      }
    });

    inMemoryBusinessOwners.forEach((o) => {
      if (!map.has(o.email.toLowerCase())) {
        map.set(o.email.toLowerCase(), o);
      }
    });

    const results = Array.from(map.values());
    if (results.length > 0) return results;

    return inMemoryBusinessOwners;
  } catch (err) {
    console.error('PostgreSQL getAllBusinessOwners Error:', err);
    return inMemoryBusinessOwners;
  }
}

export async function saveOrUpdateBusinessOwnerInDb(owner: {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  is_premium?: boolean;
  total_match_fees?: number;
  total_deposit_earnings?: number;
  total_approved_orders?: number;
}): Promise<DbBusinessOwner> {
  const trialExpires = new Date();
  trialExpires.setDate(trialExpires.getDate() + 15);

  const existingOwner = inMemoryBusinessOwners.find((o) => o.email === owner.email);
  const isPremium = owner.is_premium !== undefined ? owner.is_premium : (existingOwner ? existingOwner.is_premium : false);

  const ownerObj: DbBusinessOwner = {
    id: `owner_${owner.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: owner.name,
    email: owner.email,
    phone: owner.phone || '',
    specialty: owner.specialty || 'Full-Stack Web & AI Architecture',
    status: 'active',
    verification_status: 'verified',
    is_premium: isPremium,
    free_trial_expires_at: isPremium ? null : trialExpires.toISOString(),
    total_match_fees: owner.total_match_fees ?? 0.00,
    total_deposit_earnings: owner.total_deposit_earnings ?? 0.00,
    total_approved_orders: owner.total_approved_orders ?? 0,
    created_at: new Date().toISOString()
  };

  const existingIndex = inMemoryBusinessOwners.findIndex((o) => o.email === owner.email);
  if (existingIndex >= 0) {
    inMemoryBusinessOwners[existingIndex] = {
      ...inMemoryBusinessOwners[existingIndex],
      ...ownerObj,
      is_premium: isPremium,
      free_trial_expires_at: isPremium ? null : (inMemoryBusinessOwners[existingIndex].free_trial_expires_at || trialExpires.toISOString()),
      total_match_fees: (inMemoryBusinessOwners[existingIndex].total_match_fees || 0) + (owner.total_match_fees || 0),
      total_approved_orders: (inMemoryBusinessOwners[existingIndex].total_approved_orders || 0) + (owner.total_approved_orders || 0)
    };
  } else {
    inMemoryBusinessOwners.unshift(ownerObj);
  }

  if (!pool) return ownerObj;

  try {
    const res = await pool.query(
      `INSERT INTO business_owners (id, name, email, phone, specialty, status, verification_status, is_premium, free_trial_expires_at, total_match_fees, total_deposit_earnings, total_approved_orders, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         is_premium = EXCLUDED.is_premium,
         free_trial_expires_at = CASE WHEN EXCLUDED.is_premium = TRUE THEN NULL ELSE business_owners.free_trial_expires_at END,
         total_match_fees = business_owners.total_match_fees + EXCLUDED.total_match_fees,
         total_approved_orders = business_owners.total_approved_orders + EXCLUDED.total_approved_orders
       RETURNING *;`,
      [
        ownerObj.id,
        ownerObj.name,
        ownerObj.email,
        ownerObj.phone,
        ownerObj.specialty,
        ownerObj.status,
        ownerObj.verification_status,
        isPremium,
        isPremium ? null : trialExpires,
        ownerObj.total_match_fees,
        ownerObj.total_deposit_earnings,
        ownerObj.total_approved_orders
      ]
    );

    const row = res.rows[0];
    const rowIsPremium = Boolean(row.is_premium);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      specialty: row.specialty || 'Full-Stack Web & AI Architecture',
      status: row.status || 'active',
      verification_status: row.verification_status || 'verified',
      is_premium: rowIsPremium,
      free_trial_expires_at: rowIsPremium ? null : (row.free_trial_expires_at ? new Date(row.free_trial_expires_at).toISOString() : trialExpires.toISOString()),
      total_match_fees: Number(row.total_match_fees || 0),
      total_deposit_earnings: Number(row.total_deposit_earnings || 0),
      total_approved_orders: Number(row.total_approved_orders || 0),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };
  } catch (err) {
    console.error('PostgreSQL saveOrUpdateBusinessOwner Error:', err);
    return ownerObj;
  }
}

// ----------------- FINANCIAL TRANSACTIONS & PAYMENT HISTORY -----------------

export interface DbPayment {
  id: string;
  user_name: string;
  user_email: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

let inMemoryPayments: DbPayment[] = [];

export async function getAllPaymentsFromDb(): Promise<DbPayment[]> {
  if (!pool) return inMemoryPayments;

  try {
    const res = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    if (res.rows.length === 0) return inMemoryPayments;

    return res.rows.map((row) => ({
      id: row.id,
      user_name: row.user_name,
      user_email: row.user_email,
      type: row.type,
      amount: Number(row.amount || 0),
      status: row.status || 'SUCCESS',
      description: row.description || '',
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err) {
    console.error('PostgreSQL getAllPayments Error:', err);
    return inMemoryPayments;
  }
}

export async function savePaymentToDb(payment: {
  user_name: string;
  user_email: string;
  type: string;
  amount: number;
  description?: string;
}): Promise<DbPayment> {
  const paymentObj: DbPayment = {
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    user_name: payment.user_name,
    user_email: payment.user_email,
    type: payment.type,
    amount: payment.amount,
    status: 'SUCCESS',
    description: payment.description || '',
    created_at: new Date().toISOString()
  };

  inMemoryPayments.unshift(paymentObj);

  if (!pool) return paymentObj;

  try {
    await pool.query(
      `INSERT INTO payments (id, user_name, user_email, type, amount, status, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        paymentObj.id,
        paymentObj.user_name,
        paymentObj.user_email,
        paymentObj.type,
        paymentObj.amount,
        paymentObj.status,
        paymentObj.description
      ]
    );
  } catch (err) {
    console.error('PostgreSQL savePayment Error:', err);
  }

  return paymentObj;
}
