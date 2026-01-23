"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Plus, Check, X, Users, Target } from "lucide-react";
import { useRouter } from "next/navigation";

import { approveRequest, rejectRequest } from "@/app/actions/admin";

export default function AdminDashboard({ campaigns, requests }: any) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", targetAmount: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const res = await fetch('/api/campaign', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            setIsCreating(false);
            setFormData({ title: "", description: "", targetAmount: "" });
            router.refresh();
        }
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRequest = async (id: string, action: "APPROVE" | "REJECT", type?: "BENEFICIARY" | "VENDOR") => {
      try {
          if (action === "APPROVE" && type) {
              await approveRequest(id, type);
          } else {
              await rejectRequest(id);
          }
          // No need to router.refresh() if server action calls revalidatePath, but client side state might need update if we don't reload.
          // Server actions + revalidatePath usually handle this.
      } catch (e) {
          console.error(e);
          alert("Action failed");
      }
  };

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 cursor-pointer hover:border-accent transition-colors" onClick={() => router.push('/admin')}>
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-accent/10 rounded-lg text-accent">
                     <Target size={24} />
                 </div>
                 <h3 className="text-xl font-bold">Admin Console</h3>
             </div>
             <p className="text-slate-400 text-sm">Access the main control panel for whitelisting and fund distribution.</p>
         </Card>

         <Card className="p-6">
             <div className="text-slate-400 text-sm mb-2">Total Campaigns</div>
             <div className="text-4xl font-bold">{campaigns.length}</div>
         </Card>
         <Card className="p-6">
             <div className="text-slate-400 text-sm mb-2">Pending Requests</div>
             <div className="text-4xl font-bold text-yellow-500">{requests.length}</div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-outfit">Campaigns</h2>
            <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? "Cancel" : "New Campaign"}
            </Button>
          </div>

          {isCreating && (
              <Card className="p-6 mb-6 border-accent/20 bg-accent/5">
                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Title</label>
                          <input 
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Description</label>
                          <textarea 
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Target Amount (rUSD)</label>
                          <input 
                            type="number"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2"
                            value={formData.targetAmount}
                            onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                            required
                          />
                      </div>
                      <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                          {isLoading ? "Creating..." : "Launch Campaign"}
                      </Button>
                  </form>
              </Card>
          )}

          <div className="space-y-4">
              {campaigns.map((c: any) => (
                  <Card key={c.id} className="p-6 hover:border-white/20 transition-all group">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-lg font-bold mb-1 group-hover:text-accent transition-colors">{c.title}</h3>
                              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{c.description}</p>
                              <div className="flex gap-4 text-xs font-mono text-slate-500">
                                  <span className="flex items-center gap-1"><Target size={12}/> Target: ${c.targetAmount}</span>
                                  <span className="flex items-center gap-1"><Users size={12}/> Requests: {c._count.joinRequests}</span>
                              </div>
                          </div>
                          <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${c.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-slate-800 text-slate-400'}`}>
                              {c.status}
                          </div>
                      </div>
                  </Card>
              ))}
              {campaigns.length === 0 && <div className="text-slate-500 text-center py-8">No campaigns yet.</div>}
          </div>
        </section>

        {/* Requests Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-outfit">Pending Requests</h2>
            <div className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">{requests.length} Pending</div>
          </div>

          <div className="space-y-4">
              {requests.map((r: any) => (
                  <Card key={r.id} className="p-4 border-l-4 border-l-yellow-500">
                      <div className="flex justify-between items-start mb-3">
                          <div>
                              <div className="font-bold flex items-center gap-2">
                                  {r.user.name || "Unknown User"}
                                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{r.type}</span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-1">{r.user.email || r.user.address}</div>
                          </div>
                          <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      
                      {r.campaign && (
                          <div className="text-xs bg-white/5 p-2 rounded mb-4">
                              Requesting to join: <span className="text-accent">{r.campaign.title}</span>
                          </div>
                      )}

                      <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-success/20 hover:bg-success/30 text-success border-success/20"
                            onClick={() => handleRequest(r.id, "APPROVE", r.type as "BENEFICIARY" | "VENDOR")}
                          >
                              <Check size={14} className="mr-1"/> Approve
                          </Button>
                          <Button 
                            size="sm"
                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500/20"
                             onClick={() => handleRequest(r.id, "REJECT")}
                          >
                              <X size={14} className="mr-1"/> Reject
                          </Button>
                      </div>
                  </Card>
              ))}
              {requests.length === 0 && (
                  <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-slate-500">
                      No pending requests. Good job!
                  </div>
              )}
          </div>
        </section>
      </div>
    </div>
  );
}
