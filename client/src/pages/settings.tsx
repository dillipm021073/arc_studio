import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Key, User, Save, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminOverridePanel } from "@/components/admin/admin-override-panel";

interface UserSettings {
  id: number;
  username: string;
  email: string;
  name: string;
  role?: string;
  autoXApiKey?: string | null;
  autoXUsername?: string | null;
}

export function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    autoXApiKey: "",
    autoXUsername: ""
  });

  // Fetch current user settings
  const { data: userSettings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/users/me"],
  });

  // Update form data when user settings are loaded
  useEffect(() => {
    if (userSettings) {
      setFormData({
        autoXApiKey: userSettings.autoXApiKey || "",
        autoXUsername: userSettings.autoXUsername || ""
      });
    }
  }, [userSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { autoXApiKey: string; autoXUsername: string }) => {
      const response = await fetch("/api/users/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Settings saved",
        description: "Your AutoX settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {userSettings?.role === 'admin' && (
            <TabsTrigger value="admin">Admin Controls</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                AutoX AI Integration
              </CardTitle>
              <CardDescription>
                Configure your AutoX credentials for AI-powered capability extraction.
                These credentials are stored securely in your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  AutoX URL: <code className="font-mono text-sm">https://promptui.autox.corp.amdocs.azr/</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="autoXUsername">AutoX Username</Label>
                <Input
                  id="autoXUsername"
                  type="text"
                  placeholder="Enter your AutoX username"
                  value={formData.autoXUsername}
                  onChange={(e) => setFormData({ ...formData, autoXUsername: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Your AutoX username (e.g., dillipm)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoXApiKey">AutoX API Key</Label>
                <div className="relative">
                  <Input
                    id="autoXApiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your AutoX API key"
                    value={formData.autoXApiKey}
                    onChange={(e) => setFormData({ ...formData, autoXApiKey: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your AutoX API key for authentication
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <p className="text-sm font-medium">{userSettings?.username}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{userSettings?.email}</p>
                </div>
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium">{userSettings?.name}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <p className="text-sm font-medium capitalize">{userSettings?.role || 'user'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userSettings?.role === 'admin' && (
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Override Controls
                </CardTitle>
                <CardDescription>
                  Administrative tools for managing version control locks and overriding user checkouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminOverridePanel userRole={userSettings?.role} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}