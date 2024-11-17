import { pgTable, text, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  auth0Id: text("auth0_id").unique().notNull(),
});

export const vms = pgTable("vms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull(),
  cpu: integer("cpu").notNull(),
  ram: integer("ram").notNull(), // GB
  storage: integer("storage").notNull(), // GB
  os: text("os").notNull(),
  ipv4: text("ipv4"),
  ipv6: text("ipv6"),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  created: timestamp("created").defaultNow(),
  config: jsonb("config").notNull(),
});

export const billings = pgTable("billings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  reference: text("reference").unique().notNull(),
  created: timestamp("created").defaultNow(),
  cardholderName: text("cardholder_name").notNull(),
  cardNumber: text("card_number").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
});

export const cloudCredentials = pgTable("cloud_credentials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accessKeyId: text("access_key_id").notNull(),
  accessKeySecret: text("access_key_secret").notNull(),
  regionId: text("region_id").notNull(),
  resourceGroupId: text("resource_group_id").notNull(),
  created: timestamp("created").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertVMSchema = createInsertSchema(vms);
export const selectVMSchema = createSelectSchema(vms);
export const insertBillingSchema = createInsertSchema(billings);
export const selectBillingSchema = createSelectSchema(billings);
export const insertCloudCredentialsSchema = createInsertSchema(cloudCredentials);
export const selectCloudCredentialsSchema = createSelectSchema(cloudCredentials);

export type User = z.infer<typeof selectUserSchema>;
export type VM = z.infer<typeof selectVMSchema>;
export type Billing = z.infer<typeof selectBillingSchema>;
export type CloudCredentials = z.infer<typeof selectCloudCredentialsSchema>;
