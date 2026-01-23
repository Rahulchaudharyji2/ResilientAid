import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Create Request (User)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { campaignId, type } = body;

  try {
      const request = await prisma.joinRequest.create({
          data: {
              userId: session.user.id,
              campaignId,
              type: type || "BENEFICIARY_JOIN",
              status: "PENDING"
          }
      });
      return NextResponse.json(request);
  } catch (e) {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Update Request Status (Admin)
export async function PUT(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    const body = await req.json();
    const { id, status } = body; // status: APPROVED / REJECTED
  
    try {
        const updated = await prisma.joinRequest.update({
            where: { id },
            data: { status }
        });
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
