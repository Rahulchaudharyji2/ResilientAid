"use client";
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Admin', path: '/admin' },
    { name: 'Donor', path: '/donor' },
    { name: 'Beneficiary', path: '/beneficiary' },
    { name: 'Vendor', path: '/vendor' },
  ];

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'rgba(15, 23, 42, 0.6)', // Dark slate with opacity
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
           <h2 style={{ 
             margin: 0, 
             background: 'linear-gradient(45deg, #00d0ff, #00ff88)', 
             WebkitBackgroundClip: 'text', 
             WebkitTextFillColor: 'transparent',
             fontSize: '1.5rem',
             fontWeight: '800',
             letterSpacing: '-0.5px'
           }}>
             Resilient<span style={{ fontWeight: '300', color: '#fff', WebkitTextFillColor: '#fff' }}>Aid</span>
           </h2>
        </Link>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', overflowX: 'auto', paddingBottom: '5px' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link key={link.name} href={link.path} style={{
                textDecoration: 'none',
                color: isActive ? '#00ff88' : '#cbd5e1',
                fontSize: '0.95rem',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.2s ease',
                padding: '0.5rem 0',
                borderBottom: isActive ? '2px solid #00ff88' : '2px solid transparent'
              }}>
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <ConnectButton 
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
          showBalance={false}
          chainStatus="icon"
        />
      </div>
      
      {/* Mobile/Responsive Styles would go here, omitting for brevity in this specific tool call */}
    </nav>
  );
}
