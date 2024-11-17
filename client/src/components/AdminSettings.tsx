import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { useAuth0 } from "@auth0/auth0-react";

const adminSettingsSchema = z.object({
  websiteTitle: z.string().min(1, "Website title is required"),
  adminContactEmail: z.string().email("Invalid email address"),
  supportPhoneNumber: z.string().min(1, "Support phone number is required"),
  systemTimezone: z.string().min(1, "System timezone is required"),
  defaultCurrency: z.string().min(1, "Default currency is required"),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
  emailNotificationSettings: z.object({
    vmCreated: z.boolean(),
    vmDeleted: z.boolean(),
    paymentSuccess: z.boolean(),
    paymentFailed: z.boolean(),
  }),
  vmResourceLimits: z.object({
    maxCPU: z.number().min(1),
    maxRAM: z.number().min(1),
    maxStorage: z.number().min(1),
  }),
  customLogo: z.string().optional(),
  termsOfServiceUrl: z.string().url().optional(),
  privacyPolicyUrl: z.string().url().optional(),
});

type AdminSettingsForm = z.infer<typeof adminSettingsSchema>;

export function AdminSettings() {
  const { toast } = useToast();
  const { getAccessTokenSilently } = useAuth0();

  const { data: settings, mutate } = useSWR("/api/admin/settings", async (url) => {
    const token = await getAccessTokenSilently();
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  });

  const form = useForm<AdminSettingsForm>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: settings || {
      websiteTitle: "",
      adminContactEmail: "",
      supportPhoneNumber: "",
      systemTimezone: "UTC",
      defaultCurrency: "NGN",
      billingCycle: "monthly",
      emailNotificationSettings: {
        vmCreated: true,
        vmDeleted: true,
        paymentSuccess: true,
        paymentFailed: true,
      },
      vmResourceLimits: {
        maxCPU: 8,
        maxRAM: 16,
        maxStorage: 500,
      },
      customLogo: "",
      termsOfServiceUrl: "",
      privacyPolicyUrl: "",
    },
  });

  const onSubmit = async (data: AdminSettingsForm) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      await mutate();
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Settings update error:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="websiteTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminContactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supportPhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemTimezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Cycle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/logo.png" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="termsOfServiceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms of Service URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/terms" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="privacyPolicyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Policy URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/privacy" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
