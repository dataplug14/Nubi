import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "wouter";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, Server, Shield, LogOut } from "lucide-react";
import useSWR from "swr";
import { PaymentDialog } from "./PaymentDialog";

export function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  
  // Fetch user balance
  const { data: balance } = useSWR(
    isAuthenticated ? "/api/user/balance" : null,
    async () => {
      const token = await getAccessTokenSilently();
      const response = await fetch("/api/user/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    }
  );

  const isAdmin = user?.["https://nubis.com/roles"]?.includes("admin");

  if (!isAuthenticated) {
    return (
      <nav className="border-b bg-white px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              <Server className="h-6 w-6 text-[#DA611D]" />
              <span className="text-xl font-bold">Nubis</span>
            </a>
          </Link>
          <Button onClick={() => loginWithRedirect()}>Log In</Button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-white px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="flex items-center gap-2">
              <Server className="h-6 w-6 text-[#DA611D]" />
              <span className="text-xl font-bold">Nubis</span>
            </a>
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/">
                  <a className="flex items-center gap-2 px-4 py-2 text-sm hover:text-[#DA611D]">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </a>
                </Link>
              </NavigationMenuItem>
              {isAdmin && (
                <NavigationMenuItem>
                  <Link href="/admin">
                    <a className="flex items-center gap-2 px-4 py-2 text-sm hover:text-[#DA611D]">
                      <Shield className="h-4 w-4" />
                      Admin
                    </a>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2">
            <span className="text-sm text-gray-600">Balance:</span>
            <span className="font-medium">${balance?.amount || "0.00"}</span>
            <PaymentDialog />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout({ returnTo: window.location.origin })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
