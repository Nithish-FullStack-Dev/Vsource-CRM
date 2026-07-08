// app\api\auth\me\route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
    const token =
        (await cookies()).get(
            "access_token"
        )?.value;

    if (!token) {
        return NextResponse.json(
            {},
            {
                status: 401,
            }
        );
    }

    const payload =
        await verifyToken(token);

    if (!payload) {
        return NextResponse.json(
            {},
            {
                status: 401,
            }
        );
    }

    const user =
        await prisma.user.findUnique({
            where: {
                id: payload.id as string,
            },
            include: {
                role: {
                    include: {
                        modulePermissions: {
                            include: {
                                module: true,
                            },
                        },
                    },
                },
                branches: true,
            },
        });

    return NextResponse.json(user);
}