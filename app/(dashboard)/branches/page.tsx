// app/(dashboard)/branches/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/common/PageHeader";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
  Branch,
} from "@/lib/branches";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { canCreate, canUpdate, canDelete } = useAuth();

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const fetchBranches = async () => {
    try {
      setLoading(true);

      const data = await getBranches();

      setBranches(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) =>
      branch.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [branches, search]);

  const resetForm = () => {
    setEditingBranch(null);

    setBranchName("");
    setBranchCode("");

    setCity("");
    setAddress("");

    setEmail("");
    setPhone("");

    setState("");
    setCountry("India");

    setPincode("");

    setIsActive(true);

    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!branchName.trim()) {
      toast.error("Branch name is required");
      return;
    }

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, {
          name: branchName,
          code: branchCode,

          email,
          phone,

          city,
          state,

          country,
          pincode,

          address,
        });

        toast.success("Branch updated successfully");
      } else {
        await createBranch({
          name: branchName,
          code: branchCode,

          email,
          phone,

          city,
          state,

          country,
          pincode,

          address,
        });

        toast.success("Branch created successfully");
      }

      resetForm();

      fetchBranches();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);

    setBranchName(branch.name);
    setBranchCode(branch.code);

    setEmail(branch.email ?? "");
    setPhone(branch.phone ?? "");

    setCity(branch.city ?? "");
    setState(branch.state ?? "");

    setCountry(branch.country ?? "");
    setPincode(branch.pincode ?? "");

    setAddress(branch.address ?? "");

    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBranch(id);

      toast.success("Branch deleted successfully");

      fetchBranches();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to delete branch");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {canCreate(MODULES.BRANCHES) && (
          <PageHeader
            title="Branches"
            description="Manage branches"
            actions={
              <Button
                onClick={() => {
                  resetForm();

                  setEditingBranch(null);

                  setOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            }
          />
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? "Edit Branch" : "Create Branch"}
              </DialogTitle>
              <DialogDescription>Enter lead details.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Branch Name *</Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Dilsukhnagar Branch"
                />
              </div>

              <div className="space-y-2">
                <Label>Branch Code *</Label>
                <Input
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="DSL001"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Branch Address"
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hyderabad"
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Telangana"
                />
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                />
              </div>

              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="500060"
                />
              </div>

              {/* <div className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />

                <Label>Active Branch</Label>
              </div> */}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>

              <Button onClick={handleSubmit}>
                {editingBranch ? "Update Branch" : "Create Branch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-10"
                placeholder="Search branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-10 text-center">
              Loading branches...
            </CardContent>
          </Card>
        ) : filteredBranches.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />

              <h3 className="font-semibold">No branches found</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredBranches.map((branch) => (
              <Card key={branch.id} className="overflow-hidden rounded-2xl">
                <div className="flex h-20 items-center border-b bg-muted/40 px-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <h3 className="ml-2 text-lg font-bold">{branch.name}</h3>
                </div>

                <CardContent className="p-5">
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex min-h-[115px] flex-col items-center justify-center rounded-xl bg-muted/50 p-3 text-center">
                      <Users className="mb-2 h-4 w-4" />

                      <p className="text-lg font-bold">
                        {branch.usersCount ?? 0}
                      </p>

                      <p className="text-xs">Users</p>
                    </div>

                    <div className="flex min-h-[115px] flex-col items-center justify-center rounded-xl bg-muted/50 p-3 text-center">
                      <FileText className="mb-2 h-4 w-4" />

                      <p className="text-lg font-bold">
                        {branch.leadsCount ?? 0}
                      </p>

                      <p className="text-xs">Walk-Ins</p>
                    </div>

                    <div className="flex min-h-[115px] flex-col items-center justify-center rounded-xl bg-muted/50 p-3 text-center">
                      <GraduationCap className="mb-2 h-4 w-4" />

                      <p className="text-lg font-bold">
                        {branch.studentsCount ?? 0}
                      </p>

                      <p className="text-xs">Applications</p>
                    </div>

                    <div className="flex min-h-[115px] flex-col items-center justify-center rounded-xl bg-muted/50 p-3 text-center">
                      <ShieldCheck className="mb-2 h-4 w-4" />

                      <p className="text-lg font-bold">
                        {branch.visaApprovalsCount ?? 0}
                      </p>

                      <p className="text-xs whitespace-nowrap">
                        Visa Approvals
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    {canUpdate(MODULES.BRANCHES) && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(branch)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        {canDelete(MODULES.BRANCHES) && (
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Branch?</AlertDialogTitle>

                          <AlertDialogDescription>
                            This action cannot be undone.
                            <br />
                            <br />
                            Are you sure you want to delete
                            <span className="font-semibold">
                              {" "}
                              {branch.name}
                            </span>
                            ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() => handleDelete(branch.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Branch
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
