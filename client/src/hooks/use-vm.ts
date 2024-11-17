import useSWR from "swr";
import type { VM } from "db/schema";
import { useWebSocket } from "./use-websocket";

export function useVM(vmId?: number) {
  const { data, error, mutate } = useSWR<VM>(
    vmId ? `/api/vms/${vmId}` : null
  );

  useWebSocket(`vm:${vmId}`, () => {
    mutate();
  });

  const startVM = async () => {
    const res = await fetch(`/api/vms/${vmId}/start`, {
      method: "POST",
    });
    if (res.ok) {
      mutate();
    }
    return res.ok;
  };

  const stopVM = async () => {
    const res = await fetch(`/api/vms/${vmId}/stop`, {
      method: "POST",
    });
    if (res.ok) {
      mutate();
    }
    return res.ok;
  };

  const deleteVM = async () => {
    const res = await fetch(`/api/vms/${vmId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      mutate();
    }
    return res.ok;
  };

  return {
    vm: data,
    isLoading: !error && !data,
    error,
    startVM,
    stopVM,
    deleteVM,
  };
}

export function useVMs() {
  const { data, error, mutate } = useSWR<VM[]>("/api/vms");

  useWebSocket("vms", () => {
    mutate();
  });

  const createVM = async (vmData: Omit<VM, "id">) => {
    const res = await fetch("/api/vms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vmData),
    });
    if (res.ok) {
      mutate();
    }
    return res.ok;
  };

  return {
    vms: data || [],
    isLoading: !error && !data,
    error,
    createVM,
  };
}
