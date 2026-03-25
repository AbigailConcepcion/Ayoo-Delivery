import React, { useMemo, useState } from 'react';
import { AppScreen, UserAccount } from '../types';
import BottomNav from '../components/BottomNav';
import { IMAGES } from '../constants';

interface ServicesProps {
  user: UserAccount | null;
  deliveryCity: string;
  onNavigate: (screen: AppScreen) => void;
}

type ServicePriority = 'BALANCED' | 'FASTEST' | 'VALUE';

type ServiceCard = {
  id: AppScreen;
  icon: string;
  title: string;
  subtitle: string;
  etaRange: [number, number] | null;
  etaFallback: string;
  defaultBadge: string;
  fastBadge: string;
  valueBadge: string;
  valueHint: string;
  gradient: string;
  speedRank: number;
  valueRank: number;
  defaultRank: number;
};

const BASE_SERVICES: ServiceCard[] = [
  {
    id: 'SEARCH',
    icon: '🍔',
    title: 'Food',
    subtitle: 'All Restaurants & Milk Tea',
    etaRange: [12, 35],
    etaFallback: '12-35 mins',
    defaultBadge: 'Most Used',
    fastBadge: 'Quick Meals',
    valueBadge: 'Budget Bundles',
    valueHint: 'Best vouchers + shared bills',
    gradient: 'from-[#8B5CF6] to-[#FF66C4]',
    speedRank: 2,
    valueRank: 2,
    defaultRank: 1
  },
  {
    id: 'GROCERIES',
    icon: '🛒',
    title: 'Groceries',
    subtitle: 'Daily essentials & market runs',
    etaRange: [25, 55],
    etaFallback: '25-55 mins',
    defaultBadge: 'Daily',
    fastBadge: 'Express Slot',
    valueBadge: 'Pantry Saver',
    valueHint: 'Bulk essentials with less fees',
    gradient: 'from-[#FF2EA1] to-[#FF8CD0]',
    speedRank: 4,
    valueRank: 1,
    defaultRank: 2
  },
  {
    id: 'COURIER',
    icon: '📦',
    title: 'Drop-off',
    subtitle: 'Point-to-point parcel',
    etaRange: null,
    etaFallback: 'Distance based',
    defaultBadge: 'Live Route',
    fastBadge: 'Rush Lane',
    valueBadge: 'Safe Saver',
    valueHint: 'Drop-off code + route simulation',
    gradient: 'from-[#FF0F91] to-[#FF5CBA]',
    speedRank: 3,
    valueRank: 4,
    defaultRank: 3
  },
  {
    id: 'RIDES',
    icon: '🚕',
    title: 'Rides',
    subtitle: 'Motor, car, and XL',
    etaRange: [4, 15],
    etaFallback: '4-15 mins',
    defaultBadge: 'Fast Pickup',
    fastBadge: 'Priority Match',
    valueBadge: 'Low Fare',
    valueHint: 'Distance-based estimates by ride type',
    gradient: 'from-[#FF3AA8] to-[#FF9CD5]',
    speedRank: 1,
    valueRank: 3,
    defaultRank: 4
  },
  {
    id: 'PABILI',
    icon: '🛍️',
    title: 'Pabili',
    subtitle: 'Errands and custom requests',
    etaRange: null,
    etaFallback: 'Task based',
    defaultBadge: 'Flexible',
    fastBadge: 'Auto Match',
    valueBadge: 'Smart Budget',
    valueHint: 'Templates + rider status simulation',
    gradient: 'from-[#8B5CF6] to-[#FF79C8]',
    speedRank: 5,
    valueRank: 5,
    defaultRank: 5
  },
  {
    id: 'PAYMENTS',
    icon: '💳',
    title: 'Bills & Load',
    subtitle: 'Pay bills & buy load',
    etaRange: null,
    etaFallback: 'Instant',
    defaultBadge: 'Instant',
    fastBadge: 'Quick Pay',
    valueBadge: 'No Fees',
    valueHint: 'Electricity, water, internet, load',
    gradient: 'from-[#00BCD4] to-[#26C6DA]',
    speedRank: 6,
    valueRank: 6,
    defaultRank: 6
  },
  {
    id: 'HOME',
    icon: '🍽️',
    title: 'Dine Out',
    subtitle: 'Restaurant reservations',
    etaRange: null,
    etaFallback: 'Reserve now',
    defaultBadge: 'Book Table',
    fastBadge: 'Quick Book',
    valueBadge: 'Exclusive Deals',
    valueHint: 'Reserve your favorite restaurants',
    gradient: 'from-[#7C3AED] to-[#F06292]',
    speedRank: 7,
    valueRank: 7,
    defaultRank: 7
  },
  {
    id: 'HOME',
    icon: '💊',
    title: 'Pharmacy',
    subtitle: 'Medicines & health',
    etaRange: [15, 45],
    etaFallback: '15-45 mins',
    defaultBadge: 'Delivery',
    fastBadge: 'Express Meds',
    valueBadge: 'Generic Options',
    valueHint: ' medicines delivered to your door',
    gradient: 'from-[#F44336] to-[#EF5350]',
    speedRank: 8,
    valueRank: 8,
    defaultRank: 8
  }
];

const Services: React.FC<ServicesProps> = ({ user, deliveryCity, onNavigate }) => {
  const [priority, setPriority] = useState<ServicePriority>('BALANCED');

  const quickActions: Array<{ label: string; icon: string; target: AppScreen; desc: string }> = [
    { label: 'Track', icon: '🛰️', target: 'TRACKING', desc: 'Follow live orders' },
    { label: 'Wallet', icon: '💳', target: 'PAYMENTS', desc: 'Cards and top-up' },
    { label: 'Deals', icon: '🎟️', target: 'VOUCHERS', desc: 'Promo and perks' },
    { label: 'History', icon: '📑', target: 'HISTORY', desc: 'Past trips and orders' }
  ];

  const uniqueStack = [
    { title: 'Distance-Aware Pricing', value: 'ETA and estimates react to route, service, and traffic windows.' },
    { title: 'Barkada Shared Bills', value: 'Collect split payments before final checkout execution.' },
    { title: 'Service Router AI', value: 'One chat assistant handles food, rides, courier, and app shortcuts.' }
  ];

  const services = useMemo(() => {
    const etaMultiplier = priority === 'FASTEST' ? 0.88 : priority === 'VALUE' ? 1.12 : 1;

    const list = BASE_SERVICES.map((service) => {
      const etaHint = service.etaRange
        ? `${Math.max(2, Math.round(service.etaRange[0] * etaMultiplier))}-${Math.max(3, Math.round(service.etaRange[1] * etaMultiplier))} mins`
        : service.etaFallback;
      const badge = priority === 'FASTEST' ? service.fastBadge : priority === 'VALUE' ? service.valueBadge : service.defaultBadge;
      return { ...service, etaHint, badge };
    });

    return list.sort((a, b) => {
      if (priority === 'FASTEST') return a.speedRank - b.speedRank;
      if (priority === 'VALUE') return a.valueRank - b.valueRank;
      return a.defaultRank - b.defaultRank;
    });
  }, [priority]);

  const performanceHeadline = useMemo(() => {
    if (priority === 'FASTEST') return 'Priority mode: quickest dispatch lanes first.';
    if (priority === 'VALUE') return 'Priority mode: cost-efficient services first.';
    return 'Balanced mode: best blend of speed, value, and reliability.';
  }, [priority]);

  return (
    <div className="min-h-screen bg-[#FFF5FB] flex flex-col pb-24 overflow-y-auto scrollbar-hide">
      <header className="bg-gradient-to-br from-[#8B5CF6] via-[#FF2FA8] to-[#FF63BF] text-white px-5 pt-5 pb-7 rounded-b-[30px] shadow-xl sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-20 h-20 rounded-[28px] overflow-hidden bg-white/20 border border-white/30 shadow-xl flex items-center justify-center text-5xl">
              ⚡
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-85">Ayoo Super App</p>
              <h1 className="text-xl font-black tracking-tight leading-none truncate">Hi, {user?.name?.split(' ')[0] || 'Explorer'}</h1>
            </div>
          </div>
          <button
            onClick={() => onNavigate('PROFILE')}
            className="w-12 h-12 rounded-2xl bg-white text-[#8B5CF6] flex items-center justify-center shadow-lg"
            title="Account"
          >
            ⚙️
          </button>
        </div>

        <div className="bg-white/14 border border-white/20 rounded-2xl p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[8px] uppercase tracking-widest font-black text-white/70">Service Zone</p>
              <p className="text-sm font-black mt-1">{deliveryCity}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-widest font-black text-white/70">On-Time Rate</p>
              <p className="text-sm font-black mt-1">99.7%</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: '86%' }}></div>
          </div>
          <p className="text-[10px] font-bold text-white/90 mt-2">{performanceHeadline}</p>
        </div>
      </header>

      <main className="p-5 space-y-6">
        <section className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Dispatch Priority</h2>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8B5CF6]">One-tap personalization</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'BALANCED', label: 'Balanced' },
              { key: 'FASTEST', label: 'Fastest' },
              { key: 'VALUE', label: 'Best Value' }
            ] as Array<{ key: ServicePriority; label: string }>).map((lane) => (
              <button
                key={lane.key}
                onClick={() => setPriority(lane.key)}
                className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${priority === lane.key ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
              >
                {lane.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Services</h2>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8B5CF6]">Distance-aware ETA</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => onNavigate(service.id)}
                className="bg-white rounded-[24px] border border-gray-100 p-4 text-left shadow-sm active:scale-[0.99] transition-all"
              >
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${service.gradient} mb-3`}></div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{service.icon}</span>
                  <span className="text-[8px] px-2 py-1 rounded-lg bg-gray-100 text-gray-500 font-black uppercase tracking-widest">{service.badge}</span>
                </div>
                <h3 className="text-sm font-black mt-2 tracking-tight text-gray-900">{service.title}</h3>
                <p className="text-[11px] text-gray-500 font-bold mt-1 leading-tight">{service.subtitle}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] mt-2">{service.etaHint}</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1">{service.valueHint}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.target)}
                className="bg-[#F8FAF9] border border-gray-100 rounded-2xl p-3 text-left"
              >
                <p className="text-xl">{item.icon}</p>
                <p className="text-xs font-black text-gray-900 mt-1">{item.label}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-[#0F172A] text-white rounded-[24px] p-4 shadow-lg">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-3">Why Ayoo Is Different</h2>
          <div className="space-y-2.5">
            {uniqueStack.map((item) => (
              <div key={item.title} className="bg-white/10 border border-white/10 rounded-xl p-3">
                <p className="text-xs font-black">{item.title}</p>
                <p className="text-[11px] text-white/75 font-bold mt-1 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav active="SERVICES" onNavigate={onNavigate} mode="customer" />
    </div>
  );
};

export default Services;

