import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth0 } from "@auth0/auth0-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const alibabaCredsSchema = z.object({
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  accessKeySecret: z.string().min(1, "Access Key Secret is required"),
  regionId: z.string().min(1, "Region ID is required"),
  resourceGroupId: z.string().min(1, "Resource Group ID is required"),
});

type AlibabaCredsForm = z.infer<typeof alibabaCredsSchema>;

export function AlibabaCreds() {
  const { toast } = useToast();
  const { getAccessTokenSilently } = useAuth0();
  const form = useForm<AlibabaCredsForm>({
    resolver: zodResolver(alibabaCredsSchema),
    defaultValues: {
      accessKeyId: "",
      accessKeySecret: "",
      regionId: "",
      resourceGroupId: "",
    },
  });

  const onSubmit = async (data: AlibabaCredsForm) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch("/api/cloud/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to save credentials: ${response.statusText}`);
      }

      toast({
        title: "Success",
        description: "Cloud credentials saved successfully",
      });
      form.reset();
    } catch (error) {
      console.error("Save credentials error:", error);
      toast({
        title: "Error",
        description: "Failed to save cloud credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Configure Cloud</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alibaba Cloud Configuration</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accessKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Key ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessKeySecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Key Secret</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="regionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resourceGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Group ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
