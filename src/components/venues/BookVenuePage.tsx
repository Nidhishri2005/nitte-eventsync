import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Building2, 
  PlusCircle, 
  RotateCcw,
  Calendar,
  Clock
} from 'lucide-react';
import { Venue, User } from '../../types';
import { storage } from '../../services/storage';
import { VenueCard } from './VenueCard';
import { VenueDetailsModal } from './VenueDetailsModal';
import { AddVenueModal } from './AddVenueModal';

interface BookVenuePageProps {
  currentUser: User;
  onOpenBookWizard: (venue?: Venue) => void;
}

export const BookVenuePage: React.FC<BookVenuePageProps> = ({
  currentUser,
  onOpenBookWizard,
}) => {
  const venues = storage.getVenues();
  const [selectedDetailsVenue, setSelectedDetailsVenue] = useState<Venue | null>(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  const [checkDate, setCheckDate] = useState<string>('2026-10-28');
  const [checkStartTime, setCheckStartTime] = useState<string>('09:30');
  const [checkEndTime, setCheckEndTime] = useState<string>('12:30');

  const blocks = useMemo(() => {
    const set = new Set(venues.map(v => v.block || v.location));
    return Array.from(set).filter(Boolean);
  }, [venues]);

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = v.name.toLowerCase().includes(query);
        const matchLoc = v.location.toLowerCase().includes(query);
        const matchBlock = v.block ? v.block.toLowerCase().includes(query) : false;
        if (!matchName && !matchLoc && !matchBlock) return false;
      }
      if (selectedInstitution !== 'all' && (v.institution_id || v.institutionId) !== selectedInstitution) {
        return false;
      }
      if (v.capacity < minCapacity) {
        return false;
      }
      if (selectedBlock !== 'all' && v.block !== selectedBlock && !v.location.includes(selectedBlock)) {
        return false;
      }
      if (selectedFacility !== 'all') {
        const facLower = selectedFacility.toLowerCase();
        const facList = Array.isArray(v.facilities) 
          ? v.facilities 
          : (v.facilities || '').split(',').map(s => s.trim());
        const hasFac = facList.some(f => f.toLowerCase().includes(facLower));
        if (!hasFac) return false;
      }
      return true;
    });
  }, [venues, searchQuery, selectedInstitution, minCapacity, selectedBlock, selectedFacility]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedInstitution('all');
    setMinCapacity(0);
    setSelectedFacility('all');
    setSelectedBlock('all');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Official Campus Venues &amp; Booking
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              NMAMIT &amp; Nitte DU
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified halls, auditoriums, and seminar rooms. Check live availability and prevent duplicate scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsAddVenueOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-900" />
              <span>Add New Venue</span>
            </button>
          )}

          <button
            onClick={() => onOpenBookWizard()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Launch Booking Flow</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Live Slot Availability Checker</h4>
            <p className="text-xs text-slate-300">Set your requested event window to see which venue cards are available</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl backdrop-blur-md">
            <span className="text-slate-400 font-medium">Date:</span>
            <input
              type="date"
              value={checkDate}
              onChange={e => setCheckDate(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl backdrop-blur-md">
            <span className="text-slate-400 font-medium">Time:</span>
            <input
              type="time"
              value={checkStartTime}
              onChange={e => setCheckStartTime(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-hidden text-xs"
            />
            <span className="text-slate-400">&mdash;</span>
            <input
              type="time"
              value={checkEndTime}
              onChange={e => setCheckEndTime(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-hidden text-xs"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search venue name, block..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <select
            value={selectedInstitution}
            onChange={e => setSelectedInstitution(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">All Institutions</option>
            <option value="nmamit">NMAMIT (nmamit.in)</option>
            <option value="nitte_edu">Nitte University (nitte.edu)</option>
          </select>

          <select
            value={minCapacity}
            onChange={e => setMinCapacity(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-700 font-medium"
          >
            <option value={0}>Any Seating Capacity</option>
            <option value={100}>Min 100 Seats (Halls)</option>
            <option value={150}>Min 150 Seats</option>
            <option value={350}>Min 350 Seats (Auditorium)</option>
            <option value={1000}>Min 1000+ Seats (Amphitheatre)</option>
          </select>

          <select
            value={selectedFacility}
            onChange={e => setSelectedFacility(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">All Facilities</option>
            <option value="ac">Air Conditioning (AC)</option>
            <option value="wi-fi">Wi-Fi</option>
            <option value="lan">LAN Connection</option>
            <option value="sound">Sound Systems</option>
            <option value="projector">Projector Screen</option>
          </select>

          <select
            value={selectedBlock}
            onChange={e => setSelectedBlock(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="all">All Campus Blocks</option>
            {blocks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <strong>{filteredVenues.length}</strong> of {venues.length} venues</span>
          
          {(searchQuery || selectedInstitution !== 'all' || minCapacity > 0 || selectedFacility !== 'all' || selectedBlock !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-blue-900 font-semibold hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => {
          const conflict = storage.checkAvailability(venue.id, checkDate, checkStartTime, checkEndTime);
          const isBooked = !conflict.isAvailable;

          return (
            <VenueCard
              key={venue.id}
              venue={venue}
              onViewDetails={v => setSelectedDetailsVenue(v)}
              onBookNow={v => onOpenBookWizard(v)}
              selectedDate={checkDate}
              isBookedForSelectedTime={isBooked}
            />
          );
        })}
      </div>

      {filteredVenues.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Venues Match Your Search</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your capacity range or facilities filter to find available campus venues.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <VenueDetailsModal
        venue={selectedDetailsVenue}
        onClose={() => setSelectedDetailsVenue(null)}
        onBookVenue={v => onOpenBookWizard(v)}
      />

      {isAddVenueOpen && (
        <AddVenueModal
          isOpen={isAddVenueOpen}
          onClose={() => setIsAddVenueOpen(false)}
          onVenueAdded={() => {
            setIsAddVenueOpen(false);
          }}
        />
      )}
    </div>
  );
};
