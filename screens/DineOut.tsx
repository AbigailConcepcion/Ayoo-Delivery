import React, { useState } from 'react';
import { AppScreen } from '../types';
// Ayoo Purple Theme

interface DineOutProps {
    onBack: () => void;
    onNavigate?: (screen: AppScreen) => void;
}

// Sample dine-out restaurants data
const DINE_OUT_VENUES = [
    {
        id: '1',
        name: 'Mang Tomas Silog House',
        cuisine: 'Filipino',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1565333676648-9d744b7e5c3c?w=400',
        priceRange: '₱₱',
        distance: '0.5 km',
        features: ['Dine-in', 'Outdoor', 'WiFi'],
        description: 'Best silog meals in town'
    },
    {
        id: '2',
        name: 'Tea Haven Milk Tea',
        cuisine: 'Beverages',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        priceRange: '₱₱',
        distance: '0.8 km',
        features: ['Dine-in', 'WiFi', 'AC'],
        description: 'Premium milk tea and snacks'
    },
    {
        id: '3',
        name: 'Pizza Palace',
        cuisine: 'Italian',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        priceRange: '₱₱₱',
        distance: '1.2 km',
        features: ['Dine-in', 'Delivery', 'AC'],
        description: 'Authentic Italian pizzas'
    },
    {
        id: '4',
        name: 'Burger King Iligan',
        cuisine: 'Fast Food',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
        priceRange: '₱₱',
        distance: '0.3 km',
        features: ['Dine-in', 'Drive-thru', '24/7'],
        description: 'Famous burgers and fries'
    },
    {
        id: '5',
        name: 'Jollibee Iligan',
        cuisine: 'Fast Food',
        rating: 4.4,
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
        priceRange: '₱₱',
        distance: '0.4 km',
        features: ['Dine-in', 'Delivery', '24/7'],
        description: ' Filipino favorite fast food'
    },
    {
        id: '6',
        name: 'KFC Tibanga',
        cuisine: 'Fast Food',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
        priceRange: '₱₱',
        distance: '0.6 km',
        features: ['Dine-in', 'Drive-thru'],
        description: 'Finger-licking good chicken'
    },
];

const TIME_SLOTS = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '5:00 PM',
    '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
];

const GUESTS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const DineOut: React.FC<DineOutProps> = ({ onBack, onNavigate }) => {
    const [selectedVenue, setSelectedVenue] = useState<typeof DINE_OUT_VENUES[0] | null>(null);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [guests, setGuests] = useState('2');
    const [reservations, setReservations] = useState<{ venue: string; date: string; time: string; guests: string }[]>([]);

    const handleReserve = () => {
        if (!selectedVenue || !selectedDate || !selectedTime) return;

        const newReservation = {
            venue: selectedVenue.name,
            date: selectedDate,
            time: selectedTime,
            guests
        };

        setReservations([newReservation, ...reservations]);
        setShowReservationModal(false);
        setSelectedVenue(null);
        setSelectedDate('');
        setSelectedTime('');
        setGuests('2');
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Show reservation list if available
    if (reservations.length > 0 && !selectedVenue) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 pb-24 rounded-b-[40px] shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
                            ←
                        </button>
                        <h2 className="text-white font-black text-xl">🍽️ My Reservations</h2>
                        <div className="w-10"></div>
                    </div>
                </div>

                <div className="px-4 -mt-16 relative z-10">
                    <div className="space-y-3">
                        {reservations.map((res, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🍽️</div>
                                    <div>
                                        <p className="font-black text-gray-900">{res.venue}</p>
                                        <p className="text-xs text-gray-500">{res.date} at {res.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">{res.guests} guests</span>
                                    <span className="bg-[COLORS.successLight] text-[COLORS.success] text-xs font-bold px-3 py-1 rounded-full">Confirmed</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setReservations([])}
                        className="w-full mt-6 p-4 bg-gray-100 rounded-2xl text-gray-500 font-bold text-sm"
                    >
                        Make New Reservation
                    </button>
                </div>
            </div>
        );
    }

    // Show reservation modal
    if (showReservationModal && selectedVenue) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 pb-20 rounded-b-[40px]">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => setShowReservationModal(false)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
                            ←
                        </button>
                        <h2 className="text-white font-black text-lg">Reserve Table</h2>
                    </div>
                    <p className="text-white/80 text-sm">{selectedVenue.name}</p>
                </div>

                <div className="p-4 space-y-6 -mt-12">
                    {/* Date */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Date</label>
                        <input
                            type="date"
                            min={getTodayDate()}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-4 bg-white rounded-2xl border border-gray-100 font-bold"
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Time</label>
                        <div className="grid grid-cols-4 gap-2">
                            {TIME_SLOTS.map(time => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`p-3 rounded-xl text-xs font-bold transition-all ${selectedTime === time
                                            ? 'bg-[COLORS.primary] text-white'
                                            : 'bg-white border border-gray-100 text-gray-600'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Guests */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Number of Guests</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {GUESTS_OPTIONS.map(num => (
                                <button
                                    key={num}
                                    onClick={() => setGuests(num)}
                                    className={`flex-shrink-0 w-12 h-12 rounded-xl text-sm font-bold transition-all ${guests === num
                                            ? 'bg-[COLORS.primary] text-white'
                                            : 'bg-white border border-gray-100 text-gray-600'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleReserve}
                        disabled={!selectedDate || !selectedTime}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm ${selectedDate && selectedTime
                                ? `bg-gradient-to-r from-[COLORS.primary] to-[COLORS.primaryDark] text-white shadow-lg`
                                : 'bg-gray-200 text-gray-400'
                            }`}
                    >
                        Confirm Reservation
                    </button>
                </div>
            </div>
        );
    }

    // Show venue detail
    if (selectedVenue) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="relative">
                    <div className="h-56 overflow-hidden">
                        <img src={selectedVenue.image} alt={selectedVenue.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    <button onClick={() => setSelectedVenue(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-black">
                        ←
                    </button>
                </div>

                <div className="p-4 -mt-12 relative">
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <h2 className="text-xl font-black text-gray-900">{selectedVenue.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{selectedVenue.cuisine} • {selectedVenue.priceRange} • {selectedVenue.distance}</p>

                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-bold text-gray-900">{selectedVenue.rating}</span>
                            <span className="text-gray-400 text-sm">({Math.floor(selectedVenue.rating * 50)} reviews)</span>
                        </div>

                        <p className="text-sm text-gray-600 mt-3">{selectedVenue.description}</p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {selectedVenue.features.map((feature, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                                    {feature}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowReservationModal(true)}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-[COLORS.primary] to-[COLORS.primaryDark] text-white font-black uppercase tracking-wider rounded-2xl shadow-lg"
                        >
                            🍽️ Reserve a Table
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main view - venue list
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 pb-24 rounded-b-[40px] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
                        ←
                    </button>
                    <h2 className="text-white font-black text-xl">🍽️ Dine Out</h2>
                    <div className="w-10"></div>
                </div>
                <p className="text-white/80 text-sm">Find the best restaurants for dine-in</p>
            </div>

            <div className="px-4 -mt-16 relative z-10 space-y-3 pb-24">
                {DINE_OUT_VENUES.map(venue => (
                    <button
                        key={venue.id}
                        onClick={() => setSelectedVenue(venue)}
                        className="w-full bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex"
                    >
                        <div className="w-28 h-28 overflow-hidden">
                            <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 p-3 text-left">
                            <h3 className="font-black text-gray-900 text-sm">{venue.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{venue.cuisine} • {venue.priceRange}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-yellow-500 text-xs">⭐ {venue.rating}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs text-gray-400">{venue.distance}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DineOut;

