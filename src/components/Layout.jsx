import { Link, useLocation } from 'react-router-dom';
import LeadButton from './LeadButton';

export default function Layout() {
  const location = useLocation();
  
  // Esconde o menu na tela de portal do cliente para não atrapalhar o dono do carro
  if (location.pathname.startsWith('/status/')) {
    return null;
  }

  const menuItems = [
    { path: '/', label: '🏠 Início', color: '#3b82f6' },
    { path: '/admin', label: '🔧 Admin', color: '#FF0033' },
    { path: '/leads', label: '🎯 Clientes', color: '#22c55e' },
  ];

  return (
    <>
      <LeadButton />
      
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-3 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center transition-all ${location.pathname === item.path ? 'scale-110 opacity-100' : 'opacity-40'}`}
              style={{ color: item.color, textDecoration: 'none' }}>
              <span className="text-2xl">{item.label.split(' ')[0]}</span>
              <span className="text-[10px] font-bold uppercase mt-1">{item.label.split(' ')[1]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}