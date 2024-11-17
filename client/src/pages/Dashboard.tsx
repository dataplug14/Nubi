import { useAuth0 } from "@auth0/auth0-react";
import { CreateVMDialog } from "@/components/CreateVMDialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import { VMCard } from "@/components/VMCard";
import { useVMs } from "@/hooks/use-vm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const { vms, isLoading } = useVMs();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Button onClick={() => loginWithRedirect()}>Log In</Button>
      </div>
    );
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

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vms.map((vm) => (
            <VMCard key={vm.id} vmId={vm.id} />
          ))}
          {vms.length === 0 && (
            <Card className="col-span-full p-8 text-center">
              <p className="text-gray-600">No virtual machines yet. Create one to get started!</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
