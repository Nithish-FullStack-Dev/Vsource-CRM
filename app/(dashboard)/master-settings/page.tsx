// app\(dashboard)\master-settings\page.tsx
"use client";

import { useEffect, useState } from "react";

import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";

import {
  MasterItem,
  getMasters,
  createMaster,
  deleteMaster,
  updateMaster,
} from "@/lib/master-settings";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";

const categories = [
  {
    key: "countries",
    label: "Country",
    endpoint: "/countries",
  },
  {
    key: "intakes",
    label: "Intake",
    endpoint: "/intakes",
  },
  {
    key: "lead-sources",
    label: "Lead Source",
    endpoint: "/lead-sources",
  },
  {
    key: "lead-degrees",
    label: "Lead Degree",
    endpoint: "/lead-degrees",
  },
  {
    key: "lead-universities",
    label: "Lead University",
    endpoint: "/lead-universities",
  },
  {
    key: "banks",
    label: "Bank",
    endpoint: "/banks",
  },
] as const;

export default function MasterSettings() {
  const [selected, setSelected] = useState<(typeof categories)[number]["key"]>(
    categories[0].key,
  );
  const [items, setItems] = useState<MasterItem[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { canCreate, canUpdate, canDelete } = useAuth();

  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MasterItem | null>(null);

  const [editValue, setEditValue] = useState("");
  const current = categories.find((x) => x.key === selected)!;
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMasters(current.endpoint);
      setItems(data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selected]);

  const handleAdd = async () => {
    if (!value.trim()) return;

    try {
      setAddLoading(true);
      await createMaster(current.endpoint, value.trim());
      toast.success(`${current.label} added`);
      setValue("");
      await loadData();
    } catch {
      toast.error("Failed to add");
    } finally {
      setAddLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: boolean) => {
    try {
      setStatusLoadingId(id);

      const res = await fetch(`/api${current.endpoint}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        status ? "Activated successfully" : "Deactivated successfully",
      );

      await loadData();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    try {
      setEditLoading(true);
      await updateMaster(current.endpoint, editingItem.id, editValue);
      toast.success("Updated successfully");
      setEditDialogOpen(false);
      await loadData();
    } catch {
      toast.error("Failed to update");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      await deleteMaster(current.endpoint, id);
      toast.success("Deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Master Settings"
          description="Manage Countries, Intakes, Lead Sources, Lead Degrees, Lead Universities and Banks"
        />

        <Card className="border-none shadow-sm">
          <CardContent className="space-y-8 p-6">
            {/* TABS SECTION - Styled for clear active highlighting */}
            <div className="overflow-x-auto pb-2">
              <Tabs
                value={selected}
                onValueChange={(value) =>
                  setSelected(value as (typeof categories)[number]["key"])
                }
              >
                <TabsList className="inline-flex min-w-max h-12 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground">
                  {categories.map((item) => (
                    <TabsTrigger
                      key={item.key}
                      value={item.key}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* ADD NEW SECTION */}
            {canCreate(MODULES.MASTER_SETTINGS) && (
              <div className="flex flex-col gap-3 sm:flex-row items-center bg-muted/30 p-4 rounded-2xl border border-muted">
                <Input
                  className="flex-1 bg-background"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Add new ${current.label}...`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                />
                <Button
                  onClick={handleAdd}
                  disabled={addLoading}
                  className="w-full sm:w-auto px-8"
                >
                  {addLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {addLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            )}

            {/* GRID LAYOUT SECTION */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <p>Loading {current.label}...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                  No {current.label.toLowerCase()} found. Add one above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${
                        item.status
                          ? "border-green-200/60 bg-green-50/40 dark:border-green-500/30 dark:bg-green-500/10"
                          : "border-red-200/60 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/10"
                      }`}
                    >
                      {/* Card Header: Title & Switch */}
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex flex-col overflow-hidden">
                          <h3
                            className={`text-lg font-semibold truncate ${
                              item.status
                                ? "text-green-700 dark:text-green-300"
                                : "text-red-700 dark:text-red-300"
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </h3>
                          <span
                            className={`mt-1 text-sm font-medium ${
                              item.status
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {item.status ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {canUpdate(MODULES.MASTER_SETTINGS) && (
                          <div className="shrink-0 pt-1">
                            {statusLoadingId === item.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <Switch
                                checked={item.status}
                                onCheckedChange={(checked) =>
                                  handleStatusChange(item.id, checked)
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Actions */}
                      <div className="flex items-center justify-end gap-2 pt-4 mt-auto border-t border-black/5">
                        {canUpdate(MODULES.MASTER_SETTINGS) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl bg-background/50 hover:bg-background h-8"
                            onClick={() => {
                              setEditingItem(item);
                              setEditValue(item.name);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        )}

                        {canDelete(MODULES.MASTER_SETTINGS) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl h-8"
                            onClick={() => {
                              setDeleteItem(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {current.label.slice(0, -1)}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Enter ${current.label.slice(0, -1).toLowerCase()} name`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteItem?.name}&quot;?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground py-2">
            This action cannot be undone. Are you sure you want to permanently
            delete this item?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLoading}
              onClick={async () => {
                if (!deleteItem) return;
                await handleDelete(deleteItem.id);
                setDeleteDialogOpen(false);
              }}
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
