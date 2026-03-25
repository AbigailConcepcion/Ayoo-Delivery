import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';

interface PabiliProps {
  onBack: () => void;
  email: string;
}

type PabiliStatus = 'LOOKING_FOR_RIDER' | 'SHOPPING' | 'ON_THE_WAY' | 'DELIVERED';

interface PabiliRequest {
  id: string;
  title: string;
  store: string;
  items: string;
  budget: number;
  deliveryFee: number;
  note: string;
  status: PabiliStatus;
  createdAt: string;
}

const STORAGE_KEY = 'ayoo_pabili_requests_v1';

const Pabili: React.FC<PabiliProps> = ({ onBack, email }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [requests, setRequests] = useState<PabiliRequest[]>([]);
  const [store, setStore] = useState('7-Eleven');
  const [title, setTitle] = useState('Quick Grocery Run');
  const [items, setItems] = useState('');
  const [budget, setBudget] = useState('500');
  const [note, setNote] = useState('');

  const quickTemplates = [
    { title: 'Medicine Run', store: 'Mercury Drug', items: 'Biogesic 500mg (1 box)\nVitamin C (1 bottle)' },
    { title: 'Mini Grocery', store: '7-Eleven', items: 'Drinking water\nEggs (1 dozen)\nBread (1 loaf)' },
    { title: 'Palengke Essentials', store: 'City Public Market', items: 'Tomato 1kg\nOnion 1kg\nChicken breast 1kg' },
    { title: 'Document Drop', store: 'LBC Branch', items: 'Pick up envelope and drop at recipient address' }
  ];

  const statusLabel: Record<PabiliStatus, string> = {
    LOOKING_FOR_RIDER: 'Looking for Rider',
    SHOPPING: 'Rider Shopping',
    ON_THE_WAY: 'On the Way',
    DELIVERED: 'Delivered'
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      setRequests(parsed[email.toLowerCase()] || []);
    } catch {
      setRequests([]);
    }
  }, [email]);

  const saveRequests = (next: PabiliRequest[]) => {
    const owner = email.toLowerCase();
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[owner] = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    setRequests(next);
  };

  const activeCount = useMemo(
    () => requests.filter(req => req.status !== 'DELIVERED').length,
    [requests]
  );

  const submitRequest = async () => {
    const parsedBudget = Number(budget);
    if (!title.trim() || !store.trim() || !items.trim() || Number.isNaN(parsedBudget) || parsedBudget <= 0) return;
    setIsSubmitting(true);
    setSubmitStatus('Connecting to pabili dispatch...');
    await sleep(450);
    setSubmitStatus('Matching nearest rider...');
    await sleep(450);
    setSubmitStatus('Securing order slot...');
    await sleep(450);
    const newRequest: PabiliRequest = {
      id: `PAB-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      store: store.trim(),
      items: items.trim(),
      budget: parsedBudget,
      deliveryFee: Math.max(45, Math.round(parsedBudget * 0.08)),
      note: note.trim(),
      status: 'LOOKING_FOR_RIDER',
      createdAt: new Date().toLocaleString()
    };
    const updated = [newRequest, ...requests];
    saveRequests(updated);
    setIsSubmitting(false);
    setSubmitStatus('');
    setShowForm(false);
    setItems('');
    setNote('');
  };

  const advanceStatus = (id: string) => {
    const next = requests.map(req => {
      if (req.id !== id) return req;
      if (req.status === 'LOOKING_FOR_RIDER') return { ...req, status: 'SHOPPING' as PabiliStatus };
      if (req.status === 'SHOPPING') return { ...req, status: 'ON_THE_WAY' as PabiliStatus };
      if (req.status === 'ON_THE_WAY') return { ...req, status: 'DELIVERED' as PabiliStatus };
      return req;
    });
    saveRequests(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-28 overflow-y-auto scrollbar-hide">
      <div className="bg-white p-6 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-20">
        <button onClick={onBack} className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#8B5CF6] text-2xl font-black">←</button>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Pabili Express</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{activeCount} active requests</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-[36px] p-6 border border-gray-100 shadow-sm">
          <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-500 mb-4">Quick Templates</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickTemplates.map((tpl) => (
              <button
                key={tpl.title}
                onClick={() => {
                  setTitle(tpl.title);
                  setStore(tpl.store);
                  setItems(tpl.items);
                  setShowForm(true);
                }}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left hover:border-[#8B5CF6]/40"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] mb-1">{tpl.store}</p>
                <p className="text-xs font-black text-gray-900">{tpl.title}</p>
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-[40px] p-7 border-2 border-[#8B5CF6]/10 shadow-lg space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tighter">New Pabili Request</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Request title" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-[#8B5CF6]" />
            <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Store / Pickup place" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-[#8B5CF6]" />
            <textarea value={items} onChange={(e) => setItems(e.target.value)} placeholder="List of items / errands" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-[#8B5CF6] min-h-[96px]" />
            <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="Max budget (PHP)" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-[#8B5CF6]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes for rider (optional)" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-[#8B5CF6]" />
            {isSubmitting && <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">{submitStatus}</p>}
            <div className="flex gap-3">
              <Button onClick={submitRequest} disabled={isSubmitting} className="flex-1 py-4 font-black uppercase">{isSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
              <button onClick={() => setShowForm(false)} className="px-5 py-4 rounded-2xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase">Cancel</button>
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="py-20 text-center opacity-50">
            <p className="text-5xl mb-3">🛍️</p>
            <p className="font-black uppercase tracking-widest text-xs">No pabili requests yet</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-[34px] p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{req.id}</p>
                  <h4 className="font-black text-lg leading-none">{req.title}</h4>
                  <p className="text-xs text-gray-500 font-bold mt-1">{req.store}</p>
                </div>
                <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">{statusLabel[req.status]}</span>
              </div>
              <p className="text-xs text-gray-600 whitespace-pre-line">{req.items}</p>
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-500">
                <span>Budget ₱{req.budget.toFixed(2)}</span>
                <span>Fee ₱{req.deliveryFee.toFixed(2)}</span>
              </div>
              {req.note && <p className="text-[11px] text-gray-500">Note: {req.note}</p>}
              {req.status !== 'DELIVERED' && (
                <Button onClick={() => advanceStatus(req.id)} className="py-3 text-xs font-black uppercase tracking-widest">
                  Simulate Status Update
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white border-t border-gray-100 rounded-t-[40px] z-40">
          <Button onClick={() => setShowForm(true)} className="py-5 text-sm font-black uppercase tracking-[0.12em]">Create Pabili Request</Button>
        </div>
      )}
    </div>
  );
};

export default Pabili;
