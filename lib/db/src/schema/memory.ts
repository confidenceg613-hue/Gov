import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const memoryTable = pgTable("user_memory", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Memory = typeof memoryTable.$inferSelect;
