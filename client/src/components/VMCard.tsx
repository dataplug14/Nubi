import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVM } from "@/hooks/use-vm";
import { Play, Square, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VMCard({ vmId }: { vmId: number }) {
  const { vm, startVM, stopVM, deleteVM } = useVM(vmId);
  const { toast } = useToast();

  if (!vm) return null;

  const handleAction = async (action: () => Promise<boolean>, message: string) => {
    const success = await action();
    toast({
      title: success ? "Success" : "Error",
      description: success ? message : "Operation failed",
      variant: success ? "default" : "destructive",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{vm.name}</span>
          <span
            className={`h-3 w-3 rounded-full ${
              vm.status === "running" ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>CPU:</span>
          <span>{vm.cpu} cores</span>
          <span>RAM:</span>
          <span>{vm.ram} GB</span>
          <span>Storage:</span>
          <span>{vm.storage} GB</span>
          <span>OS:</span>
          <span>{vm.os}</span>
          <span>IPv4:</span>
          <span>{vm.ipv4}</span>
          <span>IPv6:</span>
          <span>{vm.ipv6}</span>
          <span>Cost:</span>
          <span>${vm.cost}/hour</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(startVM, "VM started successfully")}
            disabled={vm.status === "running"}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(stopVM, "VM stopped successfully")}
            disabled={vm.status !== "running"}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction(deleteVM, "VM deleted successfully")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
