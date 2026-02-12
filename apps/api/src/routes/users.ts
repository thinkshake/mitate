/**
 * Users API routes - attributes and weight management.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getAttributesForUser,
  getAttributeById,
  addAttribute,
  removeAttribute,
  calculateWeightScore,
  ATTRIBUTE_TYPE_LABELS,
  type AttributeType,
} from "../db/models/user-attributes";

const users = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const addAttributeSchema = z.object({
  type: z.enum(["region", "expertise", "experience"]),
  label: z.string().min(1).max(200),
  weight: z.number().min(0.5).max(3.0).optional(),
});

// ── Routes ─────────────────────────────────────────────────────────

/**
 * GET /users/:address/attributes - Get user's verified attributes
 */
users.get("/:address/attributes", async (c) => {
  const address = c.req.param("address");
  const attributes = getAttributesForUser(address);
  const weightScore = calculateWeightScore(attributes);

  return c.json({
    address,
    weightScore,
    attributes: attributes.map((attr) => ({
      id: attr.id,
      type: attr.attribute_type,
      typeLabel: ATTRIBUTE_TYPE_LABELS[attr.attribute_type as AttributeType] ?? attr.attribute_type,
      label: attr.attribute_label,
      weight: attr.weight,
      verifiedAt: attr.verified_at,
    })),
  });
});

/**
 * POST /users/:address/attributes - Add a new attribute
 */
users.post("/:address/attributes", zValidator("json", addAttributeSchema), async (c) => {
  const address = c.req.param("address");
  const body = c.req.valid("json");

  try {
    const attr = addAttribute({
      walletAddress: address,
      attributeType: body.type,
      attributeLabel: body.label,
      weight: body.weight,
    });

    const attributes = getAttributesForUser(address);
    const weightScore = calculateWeightScore(attributes);

    return c.json({
      attribute: {
        id: attr.id,
        type: attr.attribute_type,
        typeLabel: ATTRIBUTE_TYPE_LABELS[attr.attribute_type as AttributeType] ?? attr.attribute_type,
        label: attr.attribute_label,
        weight: attr.weight,
        verifiedAt: attr.verified_at,
      },
      weightScore,
    }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add attribute";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * DELETE /users/:address/attributes/:id - Remove an attribute
 */
users.delete("/:address/attributes/:id", async (c) => {
  const address = c.req.param("address");
  const id = c.req.param("id");

  // Verify attribute belongs to this user
  const attr = getAttributeById(id);
  if (!attr) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Attribute not found" } }, 404);
  }
  if (attr.wallet_address !== address) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Attribute does not belong to this user" } }, 403);
  }

  removeAttribute(id);

  const attributes = getAttributesForUser(address);
  const weightScore = calculateWeightScore(attributes);

  return c.json({
    deleted: true,
    weightScore,
  });
});

export default users;
