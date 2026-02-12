/**
 * Categories API route - static market category list.
 */
import { Hono } from "hono";

const categories = new Hono();

const CATEGORIES = [
  { value: "all", label: "すべて" },
  { value: "politics", label: "政治" },
  { value: "economy", label: "経済" },
  { value: "local", label: "地域" },
  { value: "culture", label: "文化" },
  { value: "tech", label: "テック" },
  { value: "general", label: "その他" },
];

/**
 * GET /categories - Get available market categories
 */
categories.get("/", async (c) => {
  return c.json({ categories: CATEGORIES });
});

export default categories;
