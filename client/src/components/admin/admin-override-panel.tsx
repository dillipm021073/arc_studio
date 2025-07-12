import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Unlock,
  Lock,
  AlertTriangle,
  Clock,
  User,
  FileX,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lock {
  lock: {
    id: number;
    artifactType: string;
    artifactId: number;
    initiativeId: string;
    lockedBy: number;
    lockExpiry: string;
    lockReason?: string;
  };
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
  } | null;
}

interface AdminOverridePanelProps {
  userRole?: string;
}

export function AdminOverridePanel({ userRole }: AdminOverridePanelProps) {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Form states for admin actions
  const [cancelForm, setCancelForm] = useState({
    artifactType: '',
    artifactId: '',
    initiativeId: '',
    reason: ''
  });

  const [forceCheckoutForm, setForceCheckoutForm] = useState({
    artifactType: '',
    artifactId: '',
    initiativeId: '',
    reason: ''
  });

  const [forceCheckinForm, setForceCheckinForm] = useState({
    artifactType: '',
    artifactId: '',
    initiativeId: '',
    changes: '',
    changeDescription: '',
    reason: ''
  });

  // Check if user is admin
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAllLocks();
    }
  }, [isAdmin]);

  const fetchAllLocks = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const response = await fetch('/api/version-control/admin/all-locks');
      if (!response.ok) throw new Error('Failed to fetch locks');
      
      const data = await response.json();
      setLocks(data.locks || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch locks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCancelCheckout = async () => {
    if (!cancelForm.artifactType || !cancelForm.artifactId || !cancelForm.initiativeId) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading('cancel');
      const response = await fetch('/api/version-control/admin/cancel-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: cancelForm.artifactType,
          artifactId: parseInt(cancelForm.artifactId),
          initiativeId: cancelForm.initiativeId,
          reason: cancelForm.reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel checkout');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: result.message
      });

      setCancelForm({ artifactType: '', artifactId: '', initiativeId: '', reason: '' });
      fetchAllLocks();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel checkout',
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceCheckout = async () => {
    if (!forceCheckoutForm.artifactType || !forceCheckoutForm.artifactId || !forceCheckoutForm.initiativeId) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading('checkout');
      const response = await fetch('/api/version-control/admin/force-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: forceCheckoutForm.artifactType,
          artifactId: parseInt(forceCheckoutForm.artifactId),
          initiativeId: forceCheckoutForm.initiativeId,
          reason: forceCheckoutForm.reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to force checkout');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `${result.message}. Overridden ${result.overriddenUsers?.length || 0} existing checkouts.`
      });

      setForceCheckoutForm({ artifactType: '', artifactId: '', initiativeId: '', reason: '' });
      fetchAllLocks();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to force checkout',
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseLock = async (lockId: number, reason?: string) => {
    try {
      setActionLoading(`release-${lockId}`);
      const response = await fetch(`/api/version-control/admin/locks/${lockId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to release lock');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: result.message
      });

      fetchAllLocks();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to release lock',
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Admin privileges required to access override controls.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Override Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Admin override actions bypass normal permission checks and can disrupt user workflows. Use with caution and always provide a reason.
            </AlertDescription>
          </Alert>

          {/* Current Locks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Locks ({locks.length})</h3>
              <Button 
                onClick={fetchAllLocks} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            {locks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No active locks found
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artifact</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Initiative</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locks.map((lock) => (
                      <TableRow key={lock.lock.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">
                              {lock.lock.artifactType}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              ID: {lock.lock.artifactId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{lock.user?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                {lock.user?.username || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {lock.lock.initiativeId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {new Date(lock.lock.lockExpiry).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Unlock className="h-4 w-4 mr-1" />
                                Release
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Release Lock</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p>Release lock for {lock.user?.name} on {lock.lock.artifactType} #{lock.lock.artifactId}?</p>
                                <Textarea
                                  placeholder="Reason for releasing lock (optional)"
                                  id={`reason-${lock.lock.id}`}
                                />
                                <Button
                                  onClick={() => {
                                    const reason = (document.getElementById(`reason-${lock.lock.id}`) as HTMLTextAreaElement)?.value;
                                    handleReleaseLock(lock.lock.id, reason);
                                  }}
                                  disabled={actionLoading === `release-${lock.lock.id}`}
                                  className="w-full"
                                >
                                  {actionLoading === `release-${lock.lock.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Unlock className="h-4 w-4 mr-2" />
                                  )}
                                  Release Lock
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cancel Checkout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileX className="h-4 w-4" />
                  Force Cancel Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={cancelForm.artifactType} 
                  onValueChange={(value) => setCancelForm(prev => ({ ...prev, artifactType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select artifact type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="interface">Interface</SelectItem>
                    <SelectItem value="business_process">Business Process</SelectItem>
                    <SelectItem value="technical_process">Technical Process</SelectItem>
                    <SelectItem value="internal_process">Internal Process</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Artifact ID"
                  type="number"
                  value={cancelForm.artifactId}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, artifactId: e.target.value }))}
                />

                <Input
                  placeholder="Initiative ID"
                  value={cancelForm.initiativeId}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, initiativeId: e.target.value }))}
                />

                <Textarea
                  placeholder="Reason for cancellation"
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                />

                <Button
                  onClick={handleAdminCancelCheckout}
                  disabled={actionLoading === 'cancel'}
                  className="w-full"
                  variant="destructive"
                >
                  {actionLoading === 'cancel' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileX className="h-4 w-4 mr-2" />
                  )}
                  Cancel Checkout
                </Button>
              </CardContent>
            </Card>

            {/* Force Checkout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Force Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={forceCheckoutForm.artifactType} 
                  onValueChange={(value) => setForceCheckoutForm(prev => ({ ...prev, artifactType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select artifact type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="interface">Interface</SelectItem>
                    <SelectItem value="business_process">Business Process</SelectItem>
                    <SelectItem value="technical_process">Technical Process</SelectItem>
                    <SelectItem value="internal_process">Internal Process</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Artifact ID"
                  type="number"
                  value={forceCheckoutForm.artifactId}
                  onChange={(e) => setForceCheckoutForm(prev => ({ ...prev, artifactId: e.target.value }))}
                />

                <Input
                  placeholder="Initiative ID"
                  value={forceCheckoutForm.initiativeId}
                  onChange={(e) => setForceCheckoutForm(prev => ({ ...prev, initiativeId: e.target.value }))}
                />

                <Textarea
                  placeholder="Reason for force checkout"
                  value={forceCheckoutForm.reason}
                  onChange={(e) => setForceCheckoutForm(prev => ({ ...prev, reason: e.target.value }))}
                />

                <Button
                  onClick={handleForceCheckout}
                  disabled={actionLoading === 'checkout'}
                  className="w-full"
                >
                  {actionLoading === 'checkout' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Force Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}