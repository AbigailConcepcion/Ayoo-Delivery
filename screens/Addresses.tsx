
import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { Address } from '../types';
import { db } from '../db';
import { PHILIPPINE_CITIES } from '../constants';

interface AddressesProps {
  onBack: () => void;
  email: string;
  currentCity: string;
}

const Addresses: React.FC<AddressesProps> = ({ onBack, email, currentCity }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [selectedCity, setSelectedCity] = useState(currentCity);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await db.getAddresses(email);
      setAddresses(data);
      setIsLoading(false);
    };
    fetch();
  }, [email]);

  const handleAdd = async () => {
    if (!newLabel || !newDetails) return;
    setIsLoading(true);
    const item: Address = { 
      id: Date.now().toString(), 
      label: newLabel, 
      details: newDetails,
      city: selectedCity
    };
    const updated = [...addresses, item];
    await db.saveAddresses(email, updated);
    setAddresses(updated);
    setNewLabel('');
    setNewDetails('');
    setShowForm(false);
    setIsLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !newLabel || !newDetails) return;
    setIsLoading(true);
    const updated = addresses.map(a => a.id === editingId ? { ...a, label: newLabel, details: newDetails, city: selectedCity } : a);
    await db.saveAddresses(email, updated);
    setAddresses(updated);
    setNewLabel('');
    setNewDetails('');
    setEditingId(null);
    setShowForm(false);
    setIsLoading(false);
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setNewLabel(address.label);
    setNewDetails(address.details);
    setSelectedCity(address.city);
    setShowForm(true);
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Delete this location?')) {
      setIsLoading(true);
      const updated = addresses.filter(a => a.id !== id);
      await db.saveAddresses(email, updated);
      setAddresses(updated);
      setIsLoading(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewLabel('');
    setNewDetails('');
    setSelectedCity(currentCity);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="bg-white p-6 flex items-center justify-between shadow-sm z-10 border-b border-gray-100">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-[#FF00CC] text-2xl font-black">←</button>
            <h2 className="text-xl font-black uppercase tracking-tighter">My Locations</h2>
         </div>
         {isLoading && (
            <div className="w-5 h-5 border-3 border-[#FF00CC] border-t-transparent rounded-full animate-spin"></div>
         )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-6">
         {isLoading && addresses.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
             <div className="w-12 h-12 ayoo-gradient rounded-full animate-bounce mb-4"></div>
             <p className="font-black uppercase tracking-widest text-xs">Syncing Cloud...</p>
           </div>
         ) : addresses.length === 0 && !showForm ? (
           <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <span className="text-6xl mb-4">📍</span>
              <p className="font-black uppercase tracking-widest text-sm">No locations saved yet.</p>
           </div>
         ) : (
           addresses.map(a => (
             <div key={a.id} className="bg-white p-7 rounded-[40px] shadow-sm flex items-center justify-between border border-gray-50 group animate-in slide-in-from-right-5 hover:border-[#FF00CC]/30 transition-all">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                     <h4 className="font-black text-gray-900 tracking-tight leading-none text-lg uppercase">{a.label}</h4>
                     <span className="bg-pink-50 text-[#FF00CC] px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">{a.city}</span>
                   </div>
                   <p className="text-xs text-gray-400 font-bold">{a.details}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEdit(a)}
                    className="w-10 h-10 bg-pink-50 text-[#FF00CC] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-pink-100 active:scale-90"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={() => handleRemove(a.id)} 
                    disabled={isLoading}
                    className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 active:scale-90"
                  >
                    ✕
                  </button>
                </div>
             </div>
           ))
         )}

         {showForm && (
           <div className="bg-white p-8 rounded-[45px] shadow-2xl border-2 border-[#FF00CC]/10 animate-in zoom-in-95">
              <h3 className="font-black text-xl mb-8 uppercase tracking-tighter leading-none">
                {editingId ? 'Edit Place' : 'Add New Place'}
              </h3>
              <div className="space-y-6">
                 <div className="input-label-border">
                    <label>Label</label>
                    <input 
                      type="text" 
                      value={newLabel} 
                      onChange={e => setNewLabel(e.target.value)}
                      placeholder="e.g. Home, Office, Bae's House"
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm uppercase transition-all"
                    />
                 </div>
                 <div className="input-label-border">
                    <label>City Hub</label>
                    <select 
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm uppercase appearance-none"
                    >
                      {PHILIPPINE_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                 </div>
                 <div className="input-label-border">
                    <label>Exact Details</label>
                    <input 
                      type="text" 
                      value={newDetails} 
                      onChange={e => setNewDetails(e.target.value)}
                      placeholder="Street, Barangay, etc."
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm transition-all"
                    />
                 </div>
                 <div className="flex flex-col gap-3 pt-4">
                    <Button onClick={editingId ? handleUpdate : handleAdd} disabled={isLoading} className="pill-shadow py-5 font-black uppercase tracking-widest text-sm">
                       {isLoading ? 'Saving...' : editingId ? 'Update Pin' : 'Pin Location'}
                    </Button>
                    <button 
                      onClick={cancelForm} 
                      className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                 </div>
              </div>
           </div>
         )}
      </div>

      {!showForm && (
        <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-gray-100 rounded-t-[50px]">
           <Button onClick={() => setShowForm(true)} className="pill-shadow py-6 font-black uppercase tracking-[0.2em] active:scale-95 transition-all">
              Add New Address
           </Button>
        </div>
      )}
    </div>
  );
};

export default Addresses;
