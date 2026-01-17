import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { txHash, from, to, amount, type, status, tokenSymbol } = body;

        const transaction = await prisma.transaction.create({
            data: {
                txHash,
                fromAddress: from,
                toAddress: to,
                amount: amount.toString(),
                type: type || 'UNKNOWN',
                status: status || 'CONFIRMED',
                tokenSymbol: tokenSymbol || 'rUSD',
            },
        });

        // Also ensure User exists (Vendor or Beneficiary)
        // Upsert From User
        await prisma.user.upsert({
            where: { address: from },
            update: {},
            create: { address: from, role: 'UNKNOWN' }
        });

        return NextResponse.json({ success: true, transaction });
    } catch (error: any) {
        console.error('Database Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (address) {
             const transactions = await prisma.transaction.findMany({
                where: { OR: [{ fromAddress: address }, { toAddress: address }] },
                orderBy: { timestamp: 'desc' },
                take: 20
            });
            return NextResponse.json(transactions);
        } else {
             const transactions = await prisma.transaction.findMany({
                orderBy: { timestamp: 'desc' },
                take: 50
            });
            return NextResponse.json(transactions);
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
