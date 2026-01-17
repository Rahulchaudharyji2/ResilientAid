import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020410] text-white overflow-x-hidden font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Premium Navbar with constrained width */}
      <nav style={{ 
        position: 'fixed', 
        top: 0, 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        zIndex: 100, 
        background: 'rgba(2, 4, 16, 0.7)', 
        backdropFilter: 'blur(12px)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <div style={{ 
            width: '100%', 
            maxWidth: '1280px', 
            padding: '1rem 2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00C6FF, #0072FF)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,114,255,0.3)' }}>🛡️</div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', fontFamily: '"Inter", sans-serif' }}>
                Resilient<span style={{ color: '#00C6FF' }}>Aid</span>
              </span>
            </div>
            {/* Wrapper to fix button cropping */}
            <div style={{ flexShrink: 0 }}>
              <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
            </div>
        </div>
      </nav>

      {/* Hero Section with Split Layout & 3D Visuals */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative', 
        padding: '6rem 5% 4rem 5%', /* Reduced top padding for mobile */
        background: `
          radial-gradient(circle at 10% 20%, rgba(0, 114, 255, 0.15) 0%, transparent 40%), 
          radial-gradient(circle at 90% 80%, rgba(0, 198, 255, 0.1) 0%, transparent 40%),
          linear-gradient(180deg, #020410 0%, #050A1F 100%)
        `
      }}>
        <div style={{ 
            maxWidth: '1400px', 
            width: '100%', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            alignItems: 'center', 
            gap: '3rem' /* Reduced gap */
        }}>
            
            {/* Left Content: Text */}
            <div style={{ textAlign: 'left', zIndex: 10 }}>
                 <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '50px', 
                    background: 'rgba(56, 239, 125, 0.1)', 
                    border: '1px solid rgba(56, 239, 125, 0.2)', 
                    fontSize: '0.8rem', 
                    color: '#38ef7d',
                    marginBottom: '1.5rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                }}>
                    <span style={{ marginRight: '0.5rem', width: '8px', height: '8px', background: '#38ef7d', borderRadius: '50%', boxShadow: '0 0 10px #38ef7d' }} />
                    LIVE ON POLYGON AMOY
                </div>

                <h1 style={{ 
                    fontSize: 'clamp(2.5rem, 8vw, 5rem)', /* Adjusted clamp for mobile */
                    fontWeight: 800, 
                    lineHeight: 1.1, 
                    marginBottom: '1.5rem', 
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", sans-serif',
                    color: '#fff'
                }}>
                    Aid that actually <br />
                    <span style={{ 
                        background: 'linear-gradient(90deg, #00C6FF 0%, #0072FF 100%)', 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent'
                    }}>
                        reaches content.
                    </span>
                </h1>
                
                <p style={{ 
                    fontSize: '1.1rem', 
                    color: '#B0B8C8', 
                    maxWidth: '550px', 
                    marginBottom: '2rem', 
                    lineHeight: 1.6 
                }}>
                    The world's first offline-capable aid distribution protocol. 
                    Zero middlemen, 100% on-chain verification, and instant settlement.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href="/donor">
                    <button style={{ 
                        padding: '0.9rem 2rem', 
                        fontSize: '1rem', 
                        fontWeight: 600,
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
                        color: '#fff', 
                        border: 'none', 
                        boxShadow: '0 10px 30px rgba(0,114,255,0.3)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}>
                        Start Donating
                    </button>
                    </Link>

                    <button style={{ 
                        padding: '0.9rem 2rem', 
                        fontSize: '1rem', 
                        fontWeight: 600,
                        borderRadius: '12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        cursor: 'pointer' 
                    }}>
                        Watch Demo
                    </button>
                </div>

                {/* Trust Metrics Mini-Row */}
                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>$0</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Platform Fees</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>100%</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Transparency</div>
                    </div>
                </div>
            </div>

            {/* Right Content: 3D Graphic */}
            <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100vw', overflow: 'hidden' }}>
                {/* Abstract Glow */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,114,255,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

                {/* Floating Cards Container */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '350px', transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)' }}>
                    
                    {/* Card 1: Donation Success */}
                    <div style={{ 
                        background: 'rgba(20, 30, 60, 0.8)', 
                        backdropFilter: 'blur(20px)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '20px', 
                        padding: '1.25rem', 
                        marginBottom: '1rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                        transform: 'translateZ(20px)',
                        animation: 'float 6s ease-in-out infinite'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div style={{ background: '#38ef7d', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#000' }}>✓</div>
                            <span style={{ color: '#38ef7d', fontSize: '0.8rem', fontWeight: 600 }}>Confirmed on Chain</span>
                        </div>
                        <div style={{ color: '#888', fontSize: '0.8rem' }}>Transaction Hash</div>
                        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem' }}>0x7f...3a9c</div>
                        <div style={{ marginTop: '0.8rem', height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                            <div style={{ width: '100%', height: '100%', background: '#38ef7d', borderRadius: '2px' }} />
                        </div>
                    </div>

                    {/* Card 2: Beneficiary Received */}
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        backdropFilter: 'blur(20px)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '20px', 
                        padding: '1.25rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                        transform: 'translateZ(0px) translateX(20px)',
                        animation: 'float 6s ease-in-out infinite 2s'
                    }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #FF512F, #DD2476)', borderRadius: '50%' }} />
                            <div>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Beneficiary Received</div>
                                <div style={{ color: '#888', fontSize: '0.7rem' }}>Just now • Uganda Relief Fund</div>
                            </div>
                         </div>
                         <div style={{ marginTop: '0.8rem', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>+ 50.00 rUSD</div>
                    </div>

                </div>
            </div>

        </div>
      </section>

      {/* Trusted By Strip */}
      <section style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#020410', padding: '2rem 1rem' }}>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Powered By Industry Leaders</p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem', opacity: 0.6, filter: 'grayscale(100%)' }}>
            {['POLYGON', 'CHAINLINK', 'THE GRAPH', 'BYBIT', 'ALCHEMY'].map(logo => (
                <span key={logo} style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{logo}</span>
            ))}
        </div>
      </section>

      {/* Interface Selection (Moved Up) */}
      <section style={{ padding: '6rem 1rem', background: '#020410' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ecosystem Interfaces</h2>
                <p style={{ color: '#888' }}>Select your role to interact with the protocol.</p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '2rem',
            }}>
              
              <FeatureCard 
                title="Admin Portal" 
                desc="Government/NGO dashboard for whitelisting & distribution." 
                icon="🏛️" 
                link="/admin" 
                gradient="linear-gradient(135deg, #FF512F, #DD2476)"
              />
              <FeatureCard 
                title="Donor Platform" 
                desc="Global funding bridge with real-time impact tracking." 
                icon="🌍" 
                link="/donor" 
                gradient="linear-gradient(135deg, #00C6FF, #0072FF)"
              />

              <FeatureCard 
                title="Beneficiary App" 
                desc="Lite-wallet for offline QR payments & balance checks." 
                icon="📱" 
                link="/beneficiary" 
                gradient="linear-gradient(135deg, #11998e, #38ef7d)"
              />
              <FeatureCard 
                title="Vendor POS" 
                desc="Merchant point-of-sale for instant voucher redemption." 
                icon="🏪" 
                link="/vendor" 
                gradient="linear-gradient(135deg, #ff9966, #ff5e62)"
              />

            </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '8rem 1rem', background: '#050A1F', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Reimagining Relief Distribution
                </h2>
                <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto' }}>A seamless protocol connecting donors directly to those in need.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                <ProcessStep 
                    number="01" 
                    title="Fund" 
                    desc="Donors send funds (ETH/Stablecoins) to specific relief categories. Smart contracts lock the value."
                    icon="💎"
                />
                <ProcessStep 
                    number="02" 
                    title="Verify" 
                    desc="Governance verifies beneficiaries and vendors. Identities are secured via ZK-Proofs."
                    icon="🔐"
                />
                <ProcessStep 
                    number="03" 
                    title="Distribute" 
                    desc="Beneficiaries pay vendors offline using signed QR vouchers. Vendors sync later to redeem."
                    icon="📡"
                />
            </div>
        </div>
      </section>



      {/* Footer */}
      <footer style={{ padding: '4rem 1rem', background: '#000', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
                 <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', fontFamily: '"Inter", sans-serif' }}>
                    Resilient<span style={{ color: '#00C6FF' }}>Aid</span>
                </span>
                <p style={{ color: '#666', marginTop: '1rem', maxWidth: '300px' }}>
                    Building the future of humanitarian aid with decentralization and privacy at its core.
                </p>
            </div>
            <div style={{ display: 'flex', gap: '3rem' }}>
                <div>
                     <h5 style={{ color: '#fff', fontWeight: 600, marginBottom: '1rem' }}>Platform</h5>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#888' }}>
                        <span>Governance</span>
                        <span>Analytics</span>
                        <span>Documentation</span>
                     </div>
                </div>
                <div>
                     <h5 style={{ color: '#fff', fontWeight: 600, marginBottom: '1rem' }}>Legal</h5>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#888' }}>
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                     </div>
                </div>
            </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '4rem', color: '#444', fontSize: '0.8rem' }}>
            © 2026 Resilient-Aid Protocol. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function ProcessStep({ number, title, desc, icon }: any) {
    return (
        <div style={{ position: 'relative', padding: '2rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ position: 'absolute', left: '-10px', top: '2rem', width: '20px', height: '20px', background: '#00C6FF', borderRadius: '50%', boxShadow: '0 0 15px #00C6FF' }} />
            <div style={{ fontSize: '4rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)', position: 'absolute', top: '0', right: '0', lineHeight: 1 }}>{number}</div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: '#888', lineHeight: 1.6 }}>{desc}</p>
        </div>
    )
}

function StatItem({ label, value, color }: any) {
    return (
        <div>
            <h4 style={{ fontSize: '3.5rem', fontWeight: 800, color: color, marginBottom: '0.5rem', lineHeight: 1 }}>{value}</h4>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>{label}</div>
        </div>
    )
}

function FeatureCard({ title, desc, icon, link, gradient }: any) {
    return (
        <Link href={link} style={{ textDecoration: 'none' }}>
            <div className="group" style={{ 
                padding: '2rem', 
                borderRadius: '24px', 
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                {/* Top Gradient Line */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: gradient }} />
                
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ 
                        width: '60px', height: '60px', 
                        borderRadius: '16px', 
                        background: 'rgba(255,255,255,0.05)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '2rem', marginBottom: '1.5rem' 
                    }}>
                        {icon}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.8rem', color: '#fff' }}>{title}</h3>
                    <p style={{ color: '#90A0B3', lineHeight: 1.6, fontSize: '0.95rem' }}>{desc}</p>
                </div>
                
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', 
                    fontSize: '0.9rem', fontWeight: 600, 
                    background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
                }}>
                    Access Portal <span style={{ transition: 'transform 0.3s' }}>&rarr;</span>
                </div>
            </div>
        </Link>
    );
}
