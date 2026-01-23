import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import Navbar from "../components/Navbar";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "DONOR";
  const userEmail = session.user.email;
  const userAddress = session.user.address; // Assuming address is added to session in auth.ts types

  // Fetch Common Data
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
        _count: { select: { joinRequests: true } }
    }
  });

  // Role-Specific Data Fetching
  // Role-Specific Data Fetching
  let pendingRequests: any[] = [];
  let myRequests: any[] = [];

  // 🔀 Role-Based Redirects
  if (role === "BENEFICIARY") {
      redirect("/beneficiary");
  } else if (role === "VENDOR") {
      redirect("/vendor");
  }

  // Role-Specific Data Fetching

  if (role === "ADMIN") {
    pendingRequests = await prisma.joinRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true, campaign: true },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // For Users, fetch their own requests to show status
    myRequests = await prisma.joinRequest.findMany({
      where: { 
          user: { 
              // Check by email OR address depending on how they logged in
              OR: [
                  { email: userEmail || undefined },
                  { address: userAddress || undefined }
              ]
           } 
      },
      include: { campaign: true }
    });
  }

  return (
    <div className="min-h-screen bg-background text-white selection:bg-accent/30">
      <Navbar />
      <main className="container mx-auto px-6 py-12 pt-24">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold font-outfit">Dashboard</h1>
                <p className="text-slate-400">Welcome, <span className="text-accent font-bold">{session.user.name || "User"}</span> ({role})</p>
            </div>
            {/* If Admin, show badge */}
            {role === "ADMIN" && (
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider">
                    Administrator Mode
                </div>
            )}
        </div>

        {role === "ADMIN" ? (
          <AdminDashboard 
            campaigns={campaigns} 
            requests={pendingRequests} 
          />
        ) : (
          <UserDashboard 
            campaigns={campaigns} 
            myRequests={myRequests} 
            role={role}
            userId={session.user.id} 
          />
        )}
      </main>
    </div>
  );
}
