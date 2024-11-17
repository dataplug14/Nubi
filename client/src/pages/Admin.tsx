import { useAuth0 } from "@auth0/auth0-react";
import { useVMs } from "@/hooks/use-vm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { AdminSettings } from "@/components/AdminSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { user, isAuthenticated } = useAuth0();
  const { vms } = useVMs();

  if (!isAuthenticated || !user?.isAdmin) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-8 text-2xl font-bold">Admin Dashboard</h1>

      <Tabs defaultValue="vms">
        <TabsList>
          <TabsTrigger value="vms">Virtual Machines</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vms">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vms.map((vm) => (
                  <TableRow key={vm.id}>
                    <TableCell>{vm.id}</TableCell>
                    <TableCell>{vm.userId}</TableCell>
                    <TableCell>{vm.name}</TableCell>
                    <TableCell>{vm.status}</TableCell>
                    <TableCell>
                      {vm.cpu} CPU, {vm.ram}GB RAM, {vm.storage}GB Storage
                    </TableCell>
                    <TableCell>${vm.cost}/hour</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
