import { useAuth0 } from "@auth0/auth0-react";
import { CreateVMDialog } from "@/components/CreateVMDialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import { VMCard } from "@/components/VMCard";
import { useVMs } from "@/hooks/use-vm";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isAuthenticated, isLoading, loginWithRedirect, user, error, getAccessTokenSilently } = useAuth0();
  const { vms, isLoading: vmsLoading, error: vmsError } = useVMs();
  const { toast } = useToast();

  // 1. Token refresh effect
  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().catch((error) => {
        toast({
          title: "Token Refresh Error",
          description: "Failed to refresh authentication token",
          variant: "destructive",
        });
      });
    }
  }, [isAuthenticated, getAccessTokenSilently, toast]);

  // 2. Authentication error handling
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // 3. VM loading error handling
  useEffect(() => {
    if (vmsError) {
      toast({
        title: "Error Loading VMs",
        description: "Failed to load virtual machines",
        variant: "destructive",
      });
    }
  }, [vmsError, toast]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Authentication check
  if (!isAuthenticated && !window.location.search.includes('code=')) {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    });
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600">Manage your virtual machines</p>
        </div>
        <div className="flex gap-2">
          <PaymentDialog />
          <CreateVMDialog />
        </div>
      </div>

      {vmsLoading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vms?.map((vm) => (
            <VMCard key={vm.id} vmId={vm.id} />
          ))}
          {(!vms || vms.length === 0) && (
            <Card className="col-span-full p-8 text-center">
              <p className="text-gray-600">No virtual machines yet. Create one to get started!</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
