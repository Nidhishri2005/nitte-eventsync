import React from 'react';
import { 
  Users, 
  MapPin, 
  Wind, 
  Wifi, 
  Network, 
  Volume2, 
  Tv, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Venue } from '../../types';

interface VenueCardProps {
  venue: Venue;
  onViewDetails: (venue: Venue) => void;
  onBookNow: (venue: Venue) => void;
  selectedDate?: string;
  isBookedForSelectedTime?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onViewDetails,
  onBookNow,
  isBookedForSelectedTime = false,
}) => {
  // Parse facilities string into individual tags
  const facilitiesArray = venue.facilities
    ? (Array.isArray(venue.facilities) 
        ? venue.facilities 
        : venue.facilities.split(',').map(f => f.trim()).filter(Boolean))
    : [];

  const renderFacilityIcon = (facility: string, index: number) => {
    const text = facility.toLowerCase();
    let Icon = Sparkles;
    let label = facility;

    if (text.includes('ac') || text.includes('air conditioning')) {
      Icon = Wind;
      label = 'AC';
    } else if (text.includes('wi-fi') || text.includes('wifi')) {
      Icon = Wifi;
      label = 'Wi-Fi';
    } else if (text.includes('lan')) {
      Icon = Network;
      label = 'LAN';
    } else if (text.includes('internet')) {
      Icon = Wifi;
      label = 'Internet';
    } else if (text.includes('sound') || text.includes('audio')) {
      Icon = Volume2;
      label = 'Sound System';
    } else if (text.includes('projector') || text.includes('screen')) {
      Icon = Tv;
      label = 'Projector Screen';
    } else if (text.includes('open-air')) {
      label = 'Open-Air Amphitheatre';
    }

    return (
      <span
        key={index}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
      >
        <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>{label}</span>
      </span>
    );
  };

  const isAvailable = venue.isAvailable !== false && !isBookedForSelectedTime;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden hover:-translate-y-0.5">
      
      {/* Venue Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900 shrink-0">
        <img
          src={venue.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

        {/* Institution Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900/90 text-blue-100 backdrop-blur-md border border-blue-700/50 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            NMAMIT
          </span>
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white backdrop-blur-md shadow-xs">
              <XCircle className="w-3.5 h-3.5" />
              Booked
            </span>
          )}
        </div>

        {/* Capacity overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-xs font-medium bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span>Capacity: <strong className="font-bold text-white">{venue.capacity}</strong> people</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-900 transition-colors">
            {venue.name}
          </h3>

          <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              <strong>Location:</strong> {venue.location}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Facilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {facilitiesArray.map((fac, idx) => renderFacilityIcon(fac, idx))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => onViewDetails(venue)}
            className="flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
          >
            View Details
          </button>

          <button
            onClick={() => onBookNow(venue)}
            className="flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 transition-colors text-center flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
