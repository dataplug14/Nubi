import { Express } from "express";
import { User, VM, Billing, CloudCredentials, SystemSettings } from "../db/schema";
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
    try {
      const userId = req.auth?.payload.sub;
      const userVMs = await VM.find({ userId });
      res.json(userVMs);
    } catch (error) {
      console.error("Error fetching VMs:", error);
      res.status(500).json({ error: "Failed to fetch VMs" });
    }
  });

  app.post("/api/vms", jwtCheck, async (req, res) => {
    try {
      const userId = req.auth?.payload.sub;
      const vmData = { ...req.body, userId };
      const newVM = await VM.create(vmData);
      wss.broadcast("vms", { type: "vm_created", vm: newVM });
      res.json(newVM);
    } catch (error) {
      console.error("Error creating VM:", error);
      res.status(500).json({ error: "Failed to create VM" });
    }
  });

  app.post("/api/vms/:id/start", jwtCheck, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth?.payload.sub;
      
      const vm = await VM.findOneAndUpdate(
        { _id: id, userId },
        { status: "running" },
        { new: true }
      );

      if (!vm) {
        return res.status(404).json({ error: "VM not found" });
      }

      wss.broadcast(`vm:${id}`, { type: "vm_started", vm });
      res.json(vm);
    } catch (error) {
      console.error("Error starting VM:", error);
      res.status(500).json({ error: "Failed to start VM" });
    }
  });

  app.post("/api/vms/:id/stop", jwtCheck, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth?.payload.sub;
      
      const vm = await VM.findOneAndUpdate(
        { _id: id, userId },
        { status: "stopped" },
        { new: true }
      );

      if (!vm) {
        return res.status(404).json({ error: "VM not found" });
      }

      wss.broadcast(`vm:${id}`, { type: "vm_stopped", vm });
      res.json(vm);
    } catch (error) {
      console.error("Error stopping VM:", error);
      res.status(500).json({ error: "Failed to stop VM" });
    }
  });

  app.delete("/api/vms/:id", jwtCheck, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth?.payload.sub;
      
      const vm = await VM.findOneAndDelete({ _id: id, userId });

      if (!vm) {
        return res.status(404).json({ error: "VM not found" });
      }

      wss.broadcast("vms", { type: "vm_deleted", vmId: id });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting VM:", error);
      res.status(500).json({ error: "Failed to delete VM" });
    }
  });

  // Billing routes - protected
  app.post("/api/billing/paystack/initialize", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    const { amount, email } = req.body;

    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100, // Paystack expects amount in kobo
          email,
          callback_url: `${req.protocol}://${req.get("host")}/api/billing/paystack/verify`,
          metadata: {
            userId,
          },
        }),
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message);
      }

      res.json(data);
    } catch (error) {
      console.error("Paystack initialization error:", error);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  });

  app.post("/api/billing/paystack/verify", jwtCheck, async (req, res) => {
    const { reference } = req.body;

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();
      if (!data.status || data.data.status !== "success") {
        throw new Error("Payment verification failed");
      }

      const userId = data.data.metadata.userId;
      const amount = (data.data.amount / 100).toString(); // Convert from kobo to naira

      const billing = await Billing.create({
        userId,
        amount,
        status: "success",
        reference,
        paymentGateway: "paystack",
        cardholderName: data.data.authorization.card_type,
        cardNumber: `**** **** **** ${data.data.authorization.last4}`,
        expiryDate: `${data.data.authorization.exp_month}/${data.data.authorization.exp_year}`,
        cvv: "***"
      });

      res.json(billing);
    } catch (error) {
      console.error("Paystack verification error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  app.post("/api/billing/flutterwave/initialize", jwtCheck, async (req, res) => {
    const userId = req.auth?.payload.sub;
    const { amount, email, cardNumber, cvv, expiryMonth, expiryYear, cardholderName } = req.body;

    try {
      const response = await fetch("https://api.flutterwave.com/v3/charges?type=card", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          card_number: cardNumber,
          cvv,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          currency: "NGN",
          amount: amount,
          email: email,
          enckey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
          tx_ref: `tx-${Date.now()}`,
          redirect_url: `${req.protocol}://${req.get("host")}/api/billing/flutterwave/verify`,
          meta: {
            userId: parseInt(userId!, 10),
          },
        }),
      });

      const data = await response.json();
      if (!data.status || data.status !== "success") {
        throw new Error(data.message);
      }

      res.json(data);
    } catch (error) {
      console.error("Flutterwave initialization error:", error);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  });

  app.post("/api/billing/flutterwave/verify", jwtCheck, async (req, res) => {
    const { transaction_id } = req.body;

    try {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      });

      const data = await response.json();
      if (!data.status || data.data.status !== "successful") {
        throw new Error("Payment verification failed");
      }

      const userId = data.data.meta.userId;
      const amount = data.data.amount.toString();

      const billing = await Billing.create({
        userId,
        amount,
        status: "success",
        reference: data.data.tx_ref,
        paymentGateway: "flutterwave",
        cardholderName: data.data.card.first_6digits,
        cardNumber: `**** **** **** ${data.data.card.last_4digits}`,
        expiryDate: `${data.data.card.expiry}`,
        cvv: "***"
      });

      res.json(billing);
    } catch (error) {
      console.error("Flutterwave verification error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  // Admin routes - protected
  app.get("/api/admin/settings", jwtCheck, async (req, res) => {
    const roles = req.auth?.payload["https://nubis.com/roles"] as string[] || [];
    const isAdmin = roles.includes("admin");
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const settings = await SystemSettings.findOne();
      res.json(settings || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", jwtCheck, async (req, res) => {
    const roles = req.auth?.payload["https://nubis.com/roles"] as string[] || [];
    const isAdmin = roles.includes("admin");
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const settings = await SystemSettings.findOne();

      if (settings) {
        const updatedSettings = await SystemSettings.findOneAndUpdate(
          { _id: settings._id },
          { ...req.body, updated: new Date() },
          { new: true }
        );
        res.json(updatedSettings);
      } else {
        const newSettings = await SystemSettings.create(req.body);
        res.json(newSettings);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/admin/vms", jwtCheck, async (req, res) => {
    const roles = req.auth?.payload["https://nubis.com/roles"] as string[] || [];
    const isAdmin = roles.includes("admin");
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const allVMs = await VM.find();
      res.json(allVMs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch VMs" });
    }
  });

  // User balance route - protected
  app.get("/api/user/balance", jwtCheck, async (req, res) => {
    try {
      const userId = req.auth?.payload.sub;
      const user = await User.findOne({ auth0Id: userId });
      res.json({ amount: user?.balance || 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });
}