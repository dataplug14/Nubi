import mongoose from 'mongoose';
import { z } from "zod";

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  auth0Id: { type: String, required: true, unique: true },
});

// VM Schema
const vmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, required: true },
  cpu: { type: Number, required: true },
  ram: { type: Number, required: true },
  storage: { type: Number, required: true },
  os: { type: String, required: true },
  ipv4: String,
  ipv6: String,
  cost: { type: Number, required: true },
  created: { type: Date, default: Date.now },
  config: { type: mongoose.Schema.Types.Mixed, required: true }
});

// Billing Schema
const billingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, required: true },
  reference: { type: String, required: true, unique: true },
  created: { type: Date, default: Date.now },
  cardholderName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cvv: { type: String, required: true },
  paymentGateway: { type: String, required: true }
});

// Cloud Credentials Schema
const cloudCredentialsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  accessKeyId: { type: String, required: true },
  accessKeySecret: { type: String, required: true },
  regionId: { type: String, required: true },
  resourceGroupId: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

// System Settings Schema
const systemSettingsSchema = new mongoose.Schema({
  websiteTitle: { type: String, required: true },
  adminContactEmail: { type: String, required: true },
  supportPhoneNumber: { type: String, required: true },
  systemTimezone: { type: String, required: true },
  defaultCurrency: { type: String, required: true },
  billingCycle: { type: String, required: true },
  emailNotificationSettings: { type: mongoose.Schema.Types.Mixed, required: true },
  vmResourceLimits: { type: mongoose.Schema.Types.Mixed, required: true },
  customLogo: String,
  termsOfServiceUrl: String,
  privacyPolicyUrl: String,
  updated: { type: Date, default: Date.now }
});

// Create models
export const User = mongoose.model('User', userSchema);
export const VM = mongoose.model('VM', vmSchema);
export const Billing = mongoose.model('Billing', billingSchema);
export const CloudCredentials = mongoose.model('CloudCredentials', cloudCredentialsSchema);
export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  isAdmin: z.boolean().default(false),
  balance: z.number().default(0),
  auth0Id: z.string().min(1)
});

export const insertVMSchema = z.object({
  name: z.string().min(1),
  userId: z.string().min(1),
  status: z.string().min(1),
  cpu: z.number().min(1),
  ram: z.number().min(1),
  storage: z.number().min(1),
  os: z.string().min(1),
  ipv4: z.string().optional(),
  ipv6: z.string().optional(),
  cost: z.number().min(0),
  config: z.record(z.any())
});

export const insertBillingSchema = z.object({
  userId: z.string().min(1),
  amount: z.string().min(1),
  status: z.string().min(1),
  reference: z.string().min(1),
  cardholderName: z.string().min(1),
  cardNumber: z.string().min(1),
  expiryDate: z.string().min(1),
  cvv: z.string().min(1),
  paymentGateway: z.string().min(1)
});

export const insertCloudCredentialsSchema = z.object({
  userId: z.string().min(1),
  accessKeyId: z.string().min(1),
  accessKeySecret: z.string().min(1),
  regionId: z.string().min(1),
  resourceGroupId: z.string().min(1)
});

export const insertSystemSettingsSchema = z.object({
  websiteTitle: z.string().min(1),
  adminContactEmail: z.string().email(),
  supportPhoneNumber: z.string().min(1),
  systemTimezone: z.string().min(1),
  defaultCurrency: z.string().min(1),
  billingCycle: z.string().min(1),
  emailNotificationSettings: z.record(z.boolean()),
  vmResourceLimits: z.record(z.number()),
  customLogo: z.string().optional(),
  termsOfServiceUrl: z.string().url().optional(),
  privacyPolicyUrl: z.string().url().optional()
});

// Type definitions
export type UserDocument = mongoose.Document & z.infer<typeof insertUserSchema>;
export type VMDocument = mongoose.Document & z.infer<typeof insertVMSchema>;
export type BillingDocument = mongoose.Document & z.infer<typeof insertBillingSchema>;
export type CloudCredentialsDocument = mongoose.Document & z.infer<typeof insertCloudCredentialsSchema>;
export type SystemSettingsDocument = mongoose.Document & z.infer<typeof insertSystemSettingsSchema>;
