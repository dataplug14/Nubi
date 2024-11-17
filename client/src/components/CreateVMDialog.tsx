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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useVMs } from "@/hooks/use-vm";
import { useToast } from "@/hooks/use-toast";
import { useAuth0 } from "@auth0/auth0-react";

export function CreateVMDialog() {
  const { createVM } = useVMs();
  const { toast } = useToast();
  const { getAccessTokenSilently } = useAuth0();
  const form = useForm({
    defaultValues: {
      name: "",
      cpu: 1,
      ram: 1,
      storage: 20,
      os: "ubuntu",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch("/api/vms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create VM: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast({
        title: "Success",
        description: "VM created successfully",
      });
      return true;
    } catch (error) {
      console.error("VM creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create VM. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create VM</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Virtual Machine</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="cpu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPU Cores</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 4, 8].map((cores) => (
                          <SelectItem key={cores} value={cores.toString()}>
                            {cores} {cores === 1 ? "core" : "cores"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="ram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RAM (GB)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 4, 8, 16].map((ram) => (
                          <SelectItem key={ram} value={ram.toString()}>
                            {ram} GB
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="storage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage (GB)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[20, 50, 100, 200, 500].map((storage) => (
                          <SelectItem key={storage} value={storage.toString()}>
                            {storage} GB
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="os"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating System</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ubuntu">Ubuntu 22.04</SelectItem>
                        <SelectItem value="debian">Debian 11</SelectItem>
                        <SelectItem value="centos">CentOS 8</SelectItem>
                        <SelectItem value="windows">Windows Server 2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create VM
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
