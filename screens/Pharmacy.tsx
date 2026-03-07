import React, { useState } from 'react';
import { AppScreen } from '../types';

interface PharmacyProps {
    onBack: () => void;
    onNavigate?: (screen: AppScreen) => void;
}

// Medicine categories
const MEDICINE_CATEGORIES = [
    { id: 'all', name: 'All', icon: '💊' },
    { id: 'fever', name: 'Fever & Pain', icon: '🌡️' },
    { id: 'cough', name: 'Cough & Cold', icon: '😷' },
    { id: 'allergy', name: 'Allergy', icon: '🤧' },
    { id: 'vitamins', name: 'Vitamins', icon: '💊' },
    { id: 'digestive', name: 'Digestive', icon: '🫁' },
    { id: 'firstaid', name: 'First Aid', icon: '🩹' },
    { id: 'personal', name: 'Personal Care', icon: '🧴' },
];

// Sample medicines/products
const MEDICINES = [
    {
        id: '1',
        name: 'Paracetamol 500mg',
        category: 'fever',
        price: 15,
        description: 'For fever and pain relief',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '2',
        name: 'Biogesic',
        category: 'fever',
        price: 18,
        description: 'Fast relief from headache and fever',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '3',
        name: 'Amoxicillin 500mg',
        category: 'cough',
        price: 85,
        description: 'Antibiotic for respiratory infections',
        image: '💊',
        inStock: true,
        requiresPrescription: true
    },
    {
        id: '4',
        name: 'Mefenamic Acid 500mg',
        category: 'fever',
        price: 25,
        description: 'For severe pain and inflammation',
        image: '💊',
        inStock: true,
        requiresPrescription: true
    },
    {
        id: '5',
        name: 'Cetirizine 10mg',
        category: 'allergy',
        price: 35,
        description: 'Anti-allergy medication',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '6',
        name: 'Vitamin C 1000mg',
        category: 'vitamins',
        price: 45,
        description: 'Immune system booster',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '7',
        name: 'Multivitamins',
        category: 'vitamins',
        price: 120,
        description: 'Daily vitamin supplement',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '8',
        name: 'Loperamide 2mg',
        category: 'digestive',
        price: 28,
        description: 'For diarrhea relief',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '9',
        name: 'Antacids',
        category: 'digestive',
        price: 32,
        description: 'For heartburn and acid reflux',
        image: '💊',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '10',
        name: 'Betadine',
        category: 'firstaid',
        price: 65,
        description: 'Antiseptic solution',
        image: '🩹',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '11',
        name: 'Bandages',
        category: 'firstaid',
        price: 25,
        description: 'Assorted bandages',
        image: '🩹',
        inStock: true,
        requiresPrescription: false
    },
    {
        id: '12',
        name: 'Hydrocortisone Cream',
        category: 'allergy',
        price: 75,
        description: 'For skin irritation and allergies',
        image: '🧴',
        inStock: true,
        requiresPrescription: false
    },
];

// Pharmacies list
const PHARMACIES = [
    { id: '1', name: 'Mercury Drug Iligan', distance: '0.5 km', rating: 4.5, open24h: true },
    { id: '2', name: 'Watson\'s Iligan', distance: '0.8 km', rating: 4.6, open24h: false },
    { id: '3', name: 'The Generics Pharmacy', distance: '1.2 km', rating: 4.3, open24h: true },
    { id: '4', name: 'Southstar Drug', distance: '1.5 km', rating: 4.4, open24h: false },
];

const Pharmacy: React.FC<PharmacyProps> = ({ onBack, onNavigate }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<typeof MEDICINES[0] | null>(null);

    const filteredMedicines = MEDICINES.filter(med => {
        const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
        const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            med.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const addToCart = (medicine: typeof MEDICINES[0]) => {
        const existing = cart.find(item => item.id === medicine.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === medicine.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { id: medicine.id, name: medicine.name, price: medicine.price, quantity: 1 }]);
        }
    };

    const removeFromCart = (id: string) => {
        const existing = cart.find(item => item.id === id);
        if (existing && existing.quantity > 1) {
            setCart(cart.map(item =>
                item.id === id
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            ));
        } else {
            setCart(cart.filter(item => item.id !== id));
        }
    };

    const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleBuyNow = (medicine: typeof MEDICINES[0]) => {
        if (medicine.requiresPrescription) {
            setSelectedMedicine(medicine);
            setShowPrescriptionModal(true);
        } else {
            addToCart(medicine);
        }
    };

    // Prescription modal
    if (showPrescriptionModal && selectedMedicine) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="bg-gradient-to-r from-[#F44336] to-[#FF9800] p-6 pb-20 rounded-b-[40px]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowPrescriptionModal(false)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
                            ←
                        </button>
                        <h2 className="text-white font-black text-lg">Prescription Required</h2>
                    </div>
                </div>

                <div className="p-4 -mt-12">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">💊</div>
                            <h3 className="font-black text-xl text-gray-900">{selectedMedicine.name}</h3>
                            <p className="text-gray-500 text-sm mt-1">This item requires a prescription</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <p className="text-yellow-800 text-sm font-bold">⚠️ Important Notice</p>
                            <p className="text-yellow-700 text-xs mt-2">
                                For prescription medicines, please visit our partner pharmacy or consult with a doctor first.
                                You can upload your prescription after checkout.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    addToCart(selectedMedicine);
                                    setShowPrescriptionModal(false);
                                    setSelectedMedicine(null);
                                }}
                                className="w-full py-3 bg-[#F44336] text-white font-black rounded-xl"
                            >
                                Add to Cart Anyway
                            </button>
                            <button
                                onClick={() => setShowPrescriptionModal(false)}
                                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Cart view
    if (showCart) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="bg-gradient-to-r from-[#F44336] to-[#FF9800] p-6 pb-20 rounded-b-[40px]">
                    <div className="flex items-center justify-between">
                        <button onClick={() => setShowCart(false)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
                            ←
                        </button>
                        <h2 className="text-white font-black text-lg">🛒 Medicine Cart</h2>
                        <div className="w-10"></div>
                    </div>
                </div>

                <div className="p-4 -mt-12 flex-1">
                    {cart.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-5xl mb-4">💊</p>
                            <p className="font-black text-gray-400">Your cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">💊</div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm text-gray-900">{item.name}</p>
                                        <p className="text-[#F44336] font-bold text-sm">₱{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => addToCart(MEDICINES.find(m => m.id === item.id)!)}
                                            className="w-8 h-8 bg-[#F44336] rounded-lg flex items-center justify-center text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-500">Total</span>
                            <span className="text-2xl font-black text-[#F44336]">₱{getCartTotal()}</span>
                        </div>
                        <button
                            onClick={() => {
                                setShowCart(false);
                                onNavigate?.('CART');
                            }}
                            className="w-full py-4 bg-gradient-to-r from-[#F44336] to-[#FF9800] text-white font-black uppercase rounded-2xl"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Main view
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#F44336] to-[#FF9800] p-6 pb-28 rounded-b-[40px] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
                        ←
                    </button>
                    <h2 className="text-white font-black text-xl">💊 Pharmacy</h2>
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white relative"
                    >
                        🛒
                        {getCartCount() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-[#F44336] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                {getCartCount()}
                            </span>
                        )}
                    </button>
                </div>
                <p className="text-white/80 text-sm">Order medicines and health products</p>
            </div>

            {/* Search */}
            <div className="px-4 -mt-20 relative z-10">
                <div className="bg-white rounded-2xl p-3 shadow-lg">
                    <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full outline-none text-sm font-bold"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="px-4 mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {MEDICINE_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full flex items-center gap-2 transition-all ${selectedCategory === cat.id
                                    ? 'bg-gradient-to-r from-[#F44336] to-[#FF9800] text-white'
                                    : 'bg-white border border-gray-100'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span className="text-xs font-bold">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Nearest Pharmacies */}
            <div className="px-4 mt-4">
                <h3 className="font-black text-gray-900 text-sm mb-2">🏪 Nearest Pharmacies</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {PHARMACIES.map(pharmacy => (
                        <div key={pharmacy.id} className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                            <p className="font-black text-xs text-gray-900">{pharmacy.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-400 text-[10px]">⭐ {pharmacy.rating}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-400 text-[10px]">{pharmacy.distance}</span>
                            </div>
                            {pharmacy.open24h && (
                                <span className="text-green-500 text-[8px] font-bold">🕐 24/7</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Medicines List */}
            <div className="flex-1 px-4 mt-4 pb-24 overflow-y-auto">
                <h3 className="font-black text-gray-900 text-sm mb-3">💊 Available Medicines</h3>
                <div className="grid grid-cols-2 gap-3">
                    {filteredMedicines.map(medicine => (
                        <div key={medicine.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                            <div className="text-3xl mb-2 text-center">{medicine.image}</div>
                            <p className="font-black text-xs text-gray-900 line-clamp-2">{medicine.name}</p>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{medicine.description}</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[#F44336] font-black text-sm">₱{medicine.price}</span>
                                {medicine.requiresPrescription && (
                                    <span className="text-orange-500 text-[8px] font-bold">Rx</span>
                                )}
                            </div>
                            <button
                                onClick={() => handleBuyNow(medicine)}
                                className={`w-full mt-2 py-2 rounded-lg text-xs font-black ${medicine.inStock
                                        ? 'bg-gradient-to-r from-[#F44336] to-[#FF9800] text-white'
                                        : 'bg-gray-200 text-gray-400'
                                    }`}
                            >
                                {medicine.inStock ? 'Buy Now' : 'Out of Stock'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pharmacy;

