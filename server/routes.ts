import { Express } from "express";
import { db } from "../db";
import { vms, billings, cloudCredentials } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { setupWebSocket } from "./websocket";
import { Server } from "http";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express, server: Server) {
  const wss = setupWebSocket(server);
  const jwtCheck = setupAuth(app);

  // Public health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // VM routes - protected
  app.get("/api/vms", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    const userVMs = await db
      .select()
      .from(vms)
      .where(eq(vms.userId, parseInt(userId!, 10)));
    res.json(userVMs);
  });

  app.post("/api/vms", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    const vmData = { ...req.body, userId: parseInt(userId!, 10) };
    const [newVM] = await db.insert(vms).values(vmData).returning();
    wss.broadcast("vms", { type: "vm_created", vm: newVM });
    res.json(newVM);
  });

  app.post("/api/vms/:id/start", jwtCheck, async (req, res) => {
    const { id } = req.params;
    const userId = req.auth?.payload.sub;
    
    const [vm] = await db
      .update(vms)
      .set({ status: "running" })
      .where(
        and(
          eq(vms.id, parseInt(id, 10)),
          eq(vms.userId, parseInt(userId!, 10))
        )
      )
      .returning();

    if (!vm) {
      return res.status(404).json({ error: "VM not found" });
    }

    wss.broadcast(`vm:${id}`, { type: "vm_started", vm });
    res.json(vm);
  });

  app.post("/api/vms/:id/stop", jwtCheck, async (req, res) => {
    const { id } = req.params;
    const userId = req.auth?.payload.sub;
    
    const [vm] = await db
      .update(vms)
      .set({ status: "stopped" })
      .where(
        and(
          eq(vms.id, parseInt(id, 10)),
          eq(vms.userId, parseInt(userId!, 10))
        )
      )
      .returning();

    if (!vm) {
      return res.status(404).json({ error: "VM not found" });
    }

    wss.broadcast(`vm:${id}`, { type: "vm_stopped", vm });
    res.json(vm);
  });

  app.delete("/api/vms/:id", jwtCheck, async (req, res) => {
    const { id } = req.params;
    const userId = req.auth?.payload.sub;
    
    const [vm] = await db
      .delete(vms)
      .where(
        and(
          eq(vms.id, parseInt(id, 10)),
          eq(vms.userId, parseInt(userId!, 10))
        )
      )
      .returning();

    if (!vm) {
      return res.status(404).json({ error: "VM not found" });
    }

    wss.broadcast("vms", { type: "vm_deleted", vmId: id });
    res.json({ success: true });
  });

  // Cloud credentials routes - protected
  app.post("/api/cloud/credentials", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    const credentials = { ...req.body, userId: parseInt(userId!, 10) };
    
    try {
      const [savedCreds] = await db
        .insert(cloudCredentials)
        .values(credentials)
        .returning();
      res.json(savedCreds);
    } catch (error) {
      res.status(500).json({ error: "Failed to save cloud credentials" });
    }
  });

  app.get("/api/cloud/credentials", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    
    try {
      const [creds] = await db
        .select()
        .from(cloudCredentials)
        .where(eq(cloudCredentials.userId, parseInt(userId!, 10)))
        .limit(1);
      res.json(creds || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cloud credentials" });
    }
  });

  // Billing routes - protected
  app.post("/api/billing/verify", jwtCheck, async (req, res) => {
    const { reference, amount, cardholderName, cardNumber, expiryDate, cvv } = req.body;
    const userId = req.auth?.payload.sub;

    const [billing] = await db
      .insert(billings)
      .values({
        userId: parseInt(userId!, 10),
        reference,
        amount,
        status: "success",
        cardholderName,
        cardNumber,
        expiryDate,
        cvv,
      })
      .returning();

    res.json(billing);
  });

  // Admin routes - protected
  app.get("/api/admin/vms", jwtCheck, async (req, res) => {
    const roles = req.auth?.payload["https://nubis.com/roles"] as string[] || [];
    const isAdmin = roles.includes("admin");
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const allVMs = await db.select().from(vms);
    res.json(allVMs);
  });

  // User balance route - protected
  app.get("/api/user/balance", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    const [user] = await db
      .select({ balance: vms.cost })
      .from(vms)
      .where(eq(vms.userId, parseInt(userId!, 10)))
      .limit(1);
    res.json({ amount: user?.balance || 0 });
  });
}
