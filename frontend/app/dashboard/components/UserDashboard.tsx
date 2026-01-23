"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { CheckCircle, Clock, Send, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import JoinRequestForm from "./JoinRequestForm";

export default function UserDashboard({ campaigns, myRequests, role, userId }: any) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  const handleJoinRequest = async (campaignId: string) => {
      setLoadingIds(prev => ({ ...prev, [campaignId]: true }));
      try {
          const res = await fetch('/api/join-request', {
              method: 'POST',
              body: JSON.stringify({ campaignId, type: role === 'VENDOR' ? 'VENDOR_JOIN' : 'BENEFICIARY_JOIN' }), // Auto-detect based on user role
              headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) router.refresh();
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingIds(prev => ({ ...prev, [campaignId]: false }));
      }
  };

  const getRequestStatus = (campaignId: string) => {
      const req = myRequests.find((r: any) => r.campaignId === campaignId);
      if (!req) return null;
      return req.status; // PENDING, APPROVED, REJECTED
  };

  return (
    <div className="space-y-8">
       {/* Welcome Banner */}
       <div className="p-8 rounded-3xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 relative overflow-hidden">
           <div className="relative z-10">
               <h2 className="text-2xl font-bold mb-2">Welcome, {role === 'BENEFICIARY' ? 'Beneficiary' : role === 'VENDOR' ? 'Partner Vendor' : 'Donor'}</h2>
               <p className="text-slate-400 max-w-xl">
                   {role === 'BENEFICIARY' 
                     ? "Find active relief campaigns below and request access to receive support directly to your wallet." 
                     : role === 'VENDOR' 
                        ? "Connect with campaigns to become an authorized vendor and accept aid vouchers for goods."
                        : "Join our platform to help others or provide supplies."}
               </p>
           </div>
       </div>

       {/* NEW: Join Platform Section for Donors */}
       {role === "DONOR" && (
           <div className="mb-8">
               <JoinRequestForm existingRequests={myRequests} />
           </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Campaigns List */}
           <div className="lg:col-span-2 space-y-6">
               <div className="flex justify-between items-center">
                   <h3 className="text-xl font-bold font-outfit">Active Campaigns</h3>
                   
                   {/* Feature Link - Only if NOT donor */}
                   {role !== "DONOR" && (
                    <Button 
                            onClick={() => router.push(role === 'VENDOR' ? '/vendor' : '/beneficiary')}
                            className="bg-accent text-black hover:bg-accent/90 font-bold"
                        >
                            {role === 'VENDOR' ? 'Open Vendor POS' : 'Open My Wallet'} <Send size={16} className="ml-2" />
                    </Button>
                   )}
               </div>
               
               <div className="space-y-4">
                  {campaigns.map((c: any) => {
                      const status = getRequestStatus(c.id);
                      const isPending = status === 'PENDING';
                      const isApproved = status === 'APPROVED';
                      const isRejected = status === 'REJECTED';

                      return (
                        <Card key={c.id} className="p-6 group hover:border-white/20 transition-all">
                            <div className="flex flex-col sm:flex-row justify-between gap-6">
                                <div>
                                    <h4 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{c.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{c.description}</p>
                                    <div className="flex gap-4 text-xs font-mono text-slate-500">
                                        <span className="bg-white/5 px-2 py-1 rounded">Target: ${c.targetAmount}</span>
                                        <span className="bg-white/5 px-2 py-1 rounded text-accent">Funds: ${c.raisedAmount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {isApproved ? (
                                        <div className="px-4 py-2 bg-success/10 text-success border border-success/20 rounded-lg font-bold flex items-center gap-2">
                                            <CheckCircle size={18} /> Enrolled
                                        </div>
                                    ) : isPending ? (
                                        <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg font-bold flex items-center gap-2">
                                            <Clock size={18} /> Pending Approval
                                        </div>
                                    ) : isRejected ? (
                                        <div className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-bold flex items-center gap-2">
                                            <ShieldAlert size={18} /> Request Rejected
                                        </div>
                                    ) : (
                                        <Button 
                                            onClick={() => handleJoinRequest(c.id)}
                                            disabled={loadingIds[c.id]}
                                            className="w-full sm:w-auto justify-center"
                                        >
                                            {loadingIds[c.id] ? "Sending..." : "Request to Join"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                      );
                  })}
               </div>
           </div>

           {/* Sidebar Stats / Info */}
           <div className="space-y-6">
               <Card className="p-6">
                   <h3 className="text-lg font-bold mb-4">My Status</h3>
                   <div className="space-y-4">
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-400">Role</span>
                           <span className="font-bold">{role}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-400">Total Enrolled</span>
                           <span className="font-bold text-success">{myRequests.filter((r:any) => r.status === 'APPROVED').length}</span>
                       </div>
                   </div>
               </Card>
           </div>
       </div>
    </div>
  );
}
