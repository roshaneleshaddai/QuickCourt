"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { facilityOwnerAPI } from "@/lib/api";
import {
  Calendar,
  Clock,
  Building2,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TimeSlotsManagement() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [blockFormData, setBlockFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility && selectedDate) {
      fetchFacilityAvailability();
    }
  }, [selectedFacility, selectedDate]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await facilityOwnerAPI.getMyFacilities();
      setFacilities(response.facilities || []);
      
      if (response.facilities && response.facilities.length > 0) {
        setSelectedFacility(response.facilities[0]);
      }
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setError(err.message);
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilityAvailability = async () => {
    if (!selectedFacility || !selectedDate) return;

    try {
      const availability = await facilityOwnerAPI.getFacilityAvailability(
        selectedFacility._id,
        selectedDate
      );
      
      // Update the facility with availability data
      setFacilities(prev => 
        prev.map(f => 
          f._id === selectedFacility._id 
            ? { ...f, availability: availability }
            : f
        )
      );
    } catch (err) {
      console.error("Error fetching availability:", err);
      toast.error("Failed to load availability data");
    }
  };

  const handleBlockTimeSlot = async (e) => {
    e.preventDefault();
    if (!selectedFacility || !selectedCourt) return;

    try {
      await facilityOwnerAPI.blockTimeSlot(
        selectedFacility._id,
        selectedCourt._id,
        blockFormData.date,
        blockFormData.startTime,
        blockFormData.endTime,
        blockFormData.reason
      );

      // Refresh availability data
      await fetchFacilityAvailability();
      
      setShowBlockModal(false);
      resetBlockForm();
      toast.success("Time slot blocked successfully!");
    } catch (err) {
      console.error("Error blocking time slot:", err);
      toast.error(err.message || "Failed to block time slot");
    }
  };

  const handleUnblockTimeSlot = async (blockId) => {
    if (!selectedFacility || !selectedCourt) return;

    try {
      await facilityOwnerAPI.unblockTimeSlot(
        selectedFacility._id,
        selectedCourt._id,
        blockId
      );

      // Refresh availability data
      await fetchFacilityAvailability();
      toast.success("Time slot unblocked successfully!");
    } catch (err) {
      console.error("Error unblocking time slot:", err);
      toast.error(err.message || "Failed to unblock time slot");
    }
  };

  const resetBlockForm = () => {
    setBlockFormData({
      date: selectedDate,
      startTime: "",
      endTime: "",
      reason: "",
    });
  };

  const openBlockModal = (court) => {
    setSelectedCourt(court);
    setBlockFormData({
      date: selectedDate,
      startTime: "",
      endTime: "",
      reason: "",
    });
    setShowBlockModal(true);
  };

  const openAvailabilityModal = (facility) => {
    setSelectedFacility(facility);
    setShowAvailabilityModal(true);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };

  const isTimeSlotBlocked = (court, time) => {
    if (!court.blockedSlots) return false;
    return court.blockedSlots.some(block => {
      const blockStart = new Date(`2000-01-01 ${block.startTime}`);
      const blockEnd = new Date(`2000-01-01 ${block.endTime}`);
      const slotTime = new Date(`2000-01-01 ${time}`);
      return slotTime >= blockStart && slotTime < blockEnd;
    });
  };

  const isTimeSlotBooked = (court, time) => {
    if (!court.bookings) return false;
    return court.bookings.some(booking => {
      const bookingStart = new Date(`2000-01-01 ${booking.startTime}`);
      const bookingEnd = new Date(`2000-01-01 ${booking.endTime}`);
      const slotTime = new Date(`2000-01-01 ${time}`);
      return slotTime >= bookingStart && slotTime < bookingEnd;
    });
  };

  const getTimeSlotStatus = (court, time) => {
    if (isTimeSlotBlocked(court, time)) return "blocked";
    if (isTimeSlotBooked(court, time)) return "booked";
    return "available";
  };

  const getTimeSlotColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-800 border-green-200",
      booked: "bg-blue-100 text-blue-800 border-blue-200",
      blocked: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || colors.available;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facilities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Facilities</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFacilities}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
          <p className="text-gray-500 mb-6">
            You need to add facilities first to manage time slots.
          </p>
          <button
            onClick={() => window.location.href = "/facilityowner/facilities"}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Facilities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Time Slots Management</h1>
        <p className="text-gray-600">
          Manage court availability and block specific time slots
        </p>
      </div>

      {/* Facility Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Facility
            </label>
            <select
              value={selectedFacility?._id || ""}
              onChange={(e) => {
                const facility = facilities.find(f => f._id === e.target.value);
                setSelectedFacility(facility);
                setSelectedCourt(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a facility</option>
              {facilities.map((facility) => (
                <option key={facility._id} value={facility._id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {selectedFacility && (
        <div className="space-y-6">
          {/* Facility Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedFacility.name}
              </h2>
              <button
                onClick={() => openAvailabilityModal(selectedFacility)}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View Full Schedule
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  {selectedFacility.address.street}, {selectedFacility.address.city}
                </span>
              </div>
              {selectedFacility.contactInfo.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Open: 6:00 AM - 10:00 PM</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-2" />
                <span>
                  {selectedFacility.sports.reduce((total, sport) => total + sport.courts.length, 0)} courts
                </span>
              </div>
            </div>
          </div>

          {/* Courts and Time Slots */}
          {selectedFacility.sports.map((sport) => (
            <div key={sport.sport._id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sport.sport.name} Courts
                </h3>
              </div>
              
              <div className="p-6">
                {sport.courts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No courts available for this sport</p>
                ) : (
                  <div className="space-y-6">
                    {sport.courts.map((court) => (
                      <div key={court._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{court.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {court.capacity} players
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                ${court.hourlyRate}/hour
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                court.type === "indoor" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {court.type}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => openBlockModal(court)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Block Time
                          </button>
                        </div>

                        {/* Time Slots Grid */}
                        <div className="grid grid-cols-17 gap-1">
                          {generateTimeSlots().map((time) => {
                            const status = getTimeSlotStatus(court, time);
                            return (
                              <div
                                key={time}
                                className={`p-2 text-xs text-center border rounded cursor-pointer transition-colors ${getTimeSlotColor(status)}`}
                                title={`${time} - ${status}`}
                              >
                                {time}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center space-x-4 mt-4 text-xs">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                            <span>Booked</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
                            <span>Blocked</span>
                          </div>
                        </div>

                        {/* Blocked Slots */}
                        {court.blockedSlots && court.blockedSlots.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Blocked Time Slots</h5>
                            <div className="space-y-2">
                              {court.blockedSlots.map((block) => (
                                <div key={block._id} className="flex items-center justify-between bg-red-50 p-2 rounded">
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      {block.date} {block.startTime} - {block.endTime}
                                    </span>
                                    {block.reason && (
                                      <span className="text-gray-600 ml-2">({block.reason})</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleUnblockTimeSlot(block._id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Unblock time slot"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Block Time Slot Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Block Time Slot - {selectedCourt?.name}
            </h2>
            <form onSubmit={handleBlockTimeSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={blockFormData.date}
                  onChange={(e) =>
                    setBlockFormData({ ...blockFormData, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <select
                    value={blockFormData.startTime}
                    onChange={(e) =>
                      setBlockFormData({ ...blockFormData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select time</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <select
                    value={blockFormData.endTime}
                    onChange={(e) =>
                      setBlockFormData({ ...blockFormData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select time</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={blockFormData.reason}
                  onChange={(e) =>
                    setBlockFormData({ ...blockFormData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="e.g., Maintenance, Private event, etc."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockModal(false);
                    setSelectedCourt(null);
                    resetBlockForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Block Time Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
