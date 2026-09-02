// app\api\roles\[id]\permissions\route.ts
import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { BulkPermissionUpsertSchema } from "@/lib/schemas";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: roleId } = await params;
    const body = await req.json();

    // Map the permissions to include the roleId for validation and insertion
    const permissions = body.permissions.map((p: any) => ({
      ...p,
      roleId,
    }));

    // Validate the modified body using BulkPermissionUpsertSchema
    const parsed = BulkPermissionUpsertSchema.parse({ permissions });

    // We can run a transaction to delete existing permissions and insert new ones
    // Or we can just use upsert or createMany
    await db.$transaction(async (tx: any) => {
      // Clear existing permissions for this role
      await tx.roleModulePermission.deleteMany({
        where: { roleId },
      });

      // Insert new permissions
      if (parsed.permissions.length > 0) {
        await tx.roleModulePermission.createMany({
          data: parsed.permissions,
        });
      }
    });

    return ok({ message: "Permissions updated successfully" });
  } catch (err) {
    return handleError(err);
  }
}
