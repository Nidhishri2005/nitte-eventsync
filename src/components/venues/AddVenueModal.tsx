import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  CheckCircle2
} from 'lucide-react';
import { Venue, InstitutionId } from '../../types';
import { storage } from '../../services/storage';
import { INSTITUTIONS } from '../../data/initialData';

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVenueAdded: (venue: Venue) => void;
}

const COMMON_FACILITIES = [
  'Air Conditioning (AC)',
  'Wi-Fi',
  'LAN',
  'Internet Connection',
  'Sound Systems',
  'Projector Screen',
  'Video Conferencing',
  'Podium Mic',
  'Stage Lighting',
  'Ample Parking',
];

export const AddVenueModal: React.FC<AddVenueModalProps> = ({
  isOpen,
  onClose,
  onVenueAdded,
}) => {
  if (!isOpen) return null;

  const [institutionId, setInstitutionId] = useState<InstitutionId>('nmamit');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [block, setBlock] = useState('S Ramanujan Block');
  const [floor, setFloor] = useState('Ground Floor');
  const [capacity, setCapacity] = useState<number>(150);
  const [facilities, setFacilities] = useState<string[]>([
    'Air Conditioning (AC)',
    'Wi-Fi',
    'Sound Systems',
    'Projector Screen',
  ]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80');
  const [contactPerson, setContactPerson] = useState('');
  const [error, setError] = useState('');

  const toggleFacility = (facility: string) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a venue name.');
      return;
    }
    if (!location.trim()) {
      setError('Please provide location details.');
      return;
    }
    if (capacity <= 0) {
      setError('Seating capacity must be greater than zero.');
      return;
    }

    const res = await storage.addVenue({
      name: name.trim(),
      institutionId,
      location: location.trim(),
      block: block.trim(),
      floor: floor.trim(),
      capacity: Number(capacity),
      facilities,
      description: description.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      isAvailable: true,
      contactPerson: contactPerson.trim(),
    });

    const newVenue = res.venue;
    if (newVenue) {
      onVenueAdded(newVenue);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">Add New Campus Venue</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 font-semibold border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Institution *
            </label>
            <select
              value={institutionId}
              onChange={e => setInstitutionId(e.target.value as InstitutionId)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-xs font-semibold"
            >
              {INSTITUTIONS.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.shortName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Venue Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Netravathi Conference Hall"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Block / Building *
              </label>
              <input
                type="text"
                value={block}
                onChange={e => setBlock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Floor *
              </label>
              <input
                type="text"
                value={floor}
                onChange={e => setFloor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Full Location String *
            </label>
            <input
              type="text"
              placeholder="e.g. 3rd Floor, APJ Kalam Block, NMAMIT"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Seating Capacity *
              </label>
              <input
                type="number"
                min={10}
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Coordinator Contact
              </label>
              <input
                type="text"
                placeholder="e.g. Estate Office (Ext: 102)"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Facilities Available
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {COMMON_FACILITIES.map(fac => {
                const checked = facilities.includes(fac);
                return (
                  <button
                    type="button"
                    key={fac}
                    onClick={() => toggleFacility(fac)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                      checked 
                        ? 'border-blue-900 bg-blue-50 text-blue-950 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      checked ? 'bg-blue-900 border-blue-900 text-white' : 'border-slate-300'
                    }`}>
                      {checked && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{fac}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Venue Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Overview Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
              placeholder="Brief description of the venue acoustic, seating, and ideal events..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold transition-colors"
            >
              Save Venue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
