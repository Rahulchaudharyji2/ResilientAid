import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, targetAmount } = body;

  try {
      const campaign = await prisma.campaign.create({
          data: {
              title,
              description,
              targetAmount: String(targetAmount)
          }
      });
      return NextResponse.json(campaign);
  } catch (e) {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
