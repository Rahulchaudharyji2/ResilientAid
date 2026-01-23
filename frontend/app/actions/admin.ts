'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createJoinRequest(type: "BENEFICIARY" | "VENDOR") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Not authenticated");

    await prisma.joinRequest.create({
        data: {
            userId: session.user.id,
            type: type,
            status: "PENDING"
        }
    });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function approveRequest(requestId: string, roleToAssign: "BENEFICIARY" | "VENDOR") {
    const session = await auth();
    // Double check admin status
    // @ts-ignore
    if (session?.user?.role !== "ADMIN" && session?.user?.email !== "rahulchaudharyji2@gmail.com") {
         throw new Error("Unauthorized");
    }

    // 1. Update Request
    const request = await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
        include: { user: true }
    });

    // 2. Update User Role
    await prisma.user.update({
        where: { id: request.userId },
        data: { role: roleToAssign }
    });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function rejectRequest(requestId: string) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== "ADMIN" && session?.user?.email !== "rahulchaudharyji2@gmail.com") {
         throw new Error("Unauthorized");
    }

    await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
    });

    revalidatePath("/dashboard");
    return { success: true };
}
