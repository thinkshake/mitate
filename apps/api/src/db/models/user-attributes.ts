/**
 * DB model for the user_attributes table.
 * User attributes affect bet weight (multiplier on effective amount).
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export type AttributeType = "region" | "expertise" | "experience";

export interface UserAttribute {
  id: string;
  wallet_address: string;
  attribute_type: AttributeType;
  attribute_label: string;
  weight: number;
  verified_at: string | null;
  created_at: string;
}

export interface UserAttributeInsert {
  walletAddress: string;
  attributeType: AttributeType;
  attributeLabel: string;
  weight?: number;
}

// ── Constants ──────────────────────────────────────────────────────

const BASE_WEIGHT = 1.0;
const MIN_WEIGHT = 0.5;
const MAX_WEIGHT = 3.0;

/** Japanese labels for attribute types */
export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  region: "地域",
  expertise: "専門知識",
  experience: "経験",
};

// ── Weight Calculation ─────────────────────────────────────────────

/**
 * Calculate the combined weight score from a list of attributes.
 * Base is 1.0, each attribute adds (weight - 1.0), clamped to [0.5, 3.0].
 */
export function calculateWeightScore(attributes: UserAttribute[]): number {
  const additionalWeight = attributes.reduce(
    (sum, attr) => sum + (attr.weight - 1.0),
    0
  );
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, BASE_WEIGHT + additionalWeight));
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Get all attributes for a wallet address.
 */
export function getAttributesForUser(walletAddress: string): UserAttribute[] {
  const db = getDb();
  return db
    .query(
      "SELECT * FROM user_attributes WHERE wallet_address = ? ORDER BY created_at ASC"
    )
    .all(walletAddress) as UserAttribute[];
}

/**
 * Get the computed weight score for a wallet address.
 */
export function getWeightScoreForUser(walletAddress: string): number {
  const attributes = getAttributesForUser(walletAddress);
  return calculateWeightScore(attributes);
}

/**
 * Add an attribute for a user. Returns the created attribute.
 * Uses INSERT OR IGNORE to avoid duplicates on the unique constraint.
 */
export function addAttribute(attr: UserAttributeInsert): UserAttribute {
  const db = getDb();
  const id = generateId("att");

  db.query(
    `INSERT INTO user_attributes
       (id, wallet_address, attribute_type, attribute_label, weight, verified_at)
     VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
  ).run(
    id,
    attr.walletAddress,
    attr.attributeType,
    attr.attributeLabel,
    attr.weight ?? 1.0
  );

  return getAttributeById(id)!;
}

/**
 * Get a single attribute by ID.
 */
export function getAttributeById(id: string): UserAttribute | null {
  const db = getDb();
  return db
    .query("SELECT * FROM user_attributes WHERE id = ?")
    .get(id) as UserAttribute | null;
}

/**
 * Remove an attribute by ID.
 */
export function removeAttribute(id: string): boolean {
  const db = getDb();
  const result = db
    .query("DELETE FROM user_attributes WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

/**
 * Remove all attributes for a wallet address.
 */
export function removeAllAttributesForUser(walletAddress: string): number {
  const db = getDb();
  const result = db
    .query("DELETE FROM user_attributes WHERE wallet_address = ?")
    .run(walletAddress);
  return result.changes;
}
