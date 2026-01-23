'use client';

import { createJoinRequest } from "@/app/actions/admin";
import { useState } from "react";

export default function JoinRequestForm({ existingRequests }: { existingRequests: any[] }) {
    const [loading, setLoading] = useState(false);

    const hasPending = existingRequests.some(r => r.status === "PENDING" && !r.campaignId);
    if (hasPending) {
        return (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <h3 className="text-xl font-bold text-yellow-500 mb-2">Application Pending</h3>
                <p className="text-slate-400">You have successfully submitted a request. The admin will review it shortly.</p>
            </div>
        );
    }

    const handleJoin = async (type: "BENEFICIARY" | "VENDOR") => {
        setLoading(true);
        try {
            await createJoinRequest(type);
        } catch (error) {
            console.error(error);
            alert("Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-outfit">Join the Platform</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <button
                    disabled={loading}
                    onClick={() => handleJoin("BENEFICIARY")}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/5 transition-all text-left group"
                >
                    <div className="text-2xl mb-2">🙏</div>
                    <div className="font-bold text-lg group-hover:text-accent">Become a Beneficiary</div>
                    <p className="text-sm text-slate-400">Request financial aid for disasters.</p>
                </button>

                <button
                    disabled={loading}
                    onClick={() => handleJoin("VENDOR")}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-green-400 hover:bg-green-400/5 transition-all text-left group"
                >
                    <div className="text-2xl mb-2">🏪</div>
                    <div className="font-bold text-lg group-hover:text-green-400">Register as Logic Vendor</div>
                    <p className="text-sm text-slate-400">Provide supplies against aid tokens.</p>
                </button>
            </div>
        </div>
    )
}
