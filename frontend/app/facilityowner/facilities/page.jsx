"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { facilityOwnerAPI, sportsAPI } from "@/lib/api";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Building2,
  Users,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

export default function FacilitiesManagement() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    contactInfo: {
      phone: "",
      email: "",
      website: "",
    },
    sports: [],
    amenities: [],
    operatingHours: {
      monday: { open: "09:00", close: "22:00", isOpen: true },
      tuesday: { open: "09:00", close: "22:00", isOpen: true },
      wednesday: { open: "09:00", close: "22:00", isOpen: true },
      thursday: { open: "09:00", close: "22:00", isOpen: true },
      friday: { open: "09:00", close: "22:00", isOpen: true },
      saturday: { open: "09:00", close: "22:00", isOpen: true },
      sunday: { open: "09:00", close: "22:00", isOpen: true },
    },
  });
  const [courtFormData, setCourtFormData] = useState({
    name: "",
    type: "indoor",
    surface: "",
    capacity: 2,
    hourlyRate: "",
    amenities: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch facilities owned by the current user
      const facilitiesData = await facilityOwnerAPI.getMyFacilities();
      setFacilities(facilitiesData.facilities || []);

      // Fetch available sports
      const sportsData = await sportsAPI.getAll();
      setAvailableSports(sportsData.sports || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      toast.error("Failed to load facilities data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacility = async (e) => {
    e.preventDefault();
    try {
      const newFacility = await facilityOwnerAPI.create(formData);
      setFacilities([...facilities, newFacility]);
      setShowAddModal(false);
      resetForm();
      toast.success("Facility added successfully!");
    } catch (err) {
      console.error("Error adding facility:", err);
      toast.error(err.message || "Failed to add facility");
    }
  };

  const handleEditFacility = async (e) => {
    e.preventDefault();
    try {
      const updatedFacility = await facilityOwnerAPI.update(selectedFacility._id, formData);
      setFacilities(
        facilities.map((f) => (f._id === selectedFacility._id ? updatedFacility : f))
      );
      setShowEditModal(false);
      setSelectedFacility(null);
      resetForm();
      toast.success("Facility updated successfully!");
    } catch (err) {
      console.error("Error updating facility:", err);
      toast.error(err.message || "Failed to update facility");
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (!confirm("Are you sure you want to delete this facility?")) return;

    try {
      await facilityOwnerAPI.delete(facilityId);
      setFacilities(facilities.filter((f) => f._id !== facilityId));
      toast.success("Facility deleted successfully!");
    } catch (err) {
      console.error("Error deleting facility:", err);
      toast.error(err.message || "Failed to delete facility");
    }
  };

  const handleAddCourt = async (e) => {
    e.preventDefault();
    try {
      const newCourt = await facilityOwnerAPI.addCourt(
        selectedFacility._id,
        selectedSport._id,
        courtFormData
      );
      
      // Update the facility in the local state
      setFacilities(
        facilities.map((f) => {
          if (f._id === selectedFacility._id) {
            const updatedSports = f.sports.map((s) => {
              if (s.sport._id === selectedSport._id) {
                return { ...s, courts: [...s.courts, newCourt] };
              }
              return s;
            });
            return { ...f, sports: updatedSports };
          }
          return f;
        })
      );

      setShowCourtModal(false);
      setSelectedFacility(null);
      setSelectedSport(null);
      resetCourtForm();
      toast.success("Court added successfully!");
    } catch (err) {
      console.error("Error adding court:", err);
      toast.error(err.message || "Failed to add court");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      contactInfo: {
        phone: "",
        email: "",
        website: "",
      },
      sports: [],
      amenities: [],
      operatingHours: {
        monday: { open: "09:00", close: "22:00", isOpen: true },
        tuesday: { open: "09:00", close: "22:00", isOpen: true },
        wednesday: { open: "09:00", close: "22:00", isOpen: true },
        thursday: { open: "09:00", close: "22:00", isOpen: true },
        friday: { open: "09:00", close: "22:00", isOpen: true },
        saturday: { open: "09:00", close: "22:00", isOpen: true },
        sunday: { open: "09:00", close: "22:00", isOpen: true },
      },
    });
  };

  const resetCourtForm = () => {
    setCourtFormData({
      name: "",
      type: "indoor",
      surface: "",
      capacity: 2,
      hourlyRate: "",
      amenities: [],
    });
  };

  const openEditModal = (facility) => {
    setSelectedFacility(facility);
    setFormData({
      name: facility.name,
      description: facility.description,
      address: facility.address,
      contactInfo: facility.contactInfo,
      sports: facility.sports,
      amenities: facility.amenities,
      operatingHours: facility.operatingHours,
    });
    setShowEditModal(true);
  };

  const openCourtModal = (facility, sport) => {
    setSelectedFacility(facility);
    setSelectedSport(sport);
    setShowCourtModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
            onClick={fetchData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Facilities Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Facility</span>
        </button>
      </div>

      {facilities.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities yet</h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first sports facility.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Your First Facility
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <div key={facility._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(facility)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFacility(facility._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {facility.description && (
                  <p className="text-gray-600 mb-4">{facility.description}</p>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {facility.address.street}, {facility.address.city}
                    </span>
                  </div>
                  {facility.contactInfo.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{facility.contactInfo.phone}</span>
                    </div>
                  )}
                  {facility.contactInfo.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{facility.contactInfo.email}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Sports & Courts</h4>
                  <div className="space-y-2">
                    {facility.sports.map((sport) => (
                      <div key={sport.sport._id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {sport.sport.name} ({sport.courts.length} courts)
                        </span>
                        <button
                          onClick={() => openCourtModal(facility, sport)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Add Court
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Total Courts: {facility.sports.reduce((total, sport) => total + sport.courts.length, 0)}
                    </span>
                    <span className="text-gray-600">
                      Rating: {facility.rating?.average?.toFixed(1) || "N/A"} ⭐
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Facility</h2>
            <form onSubmit={handleAddFacility} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, phone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, email: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Facility Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Facility</h2>
            <form onSubmit={handleEditFacility} className="space-y-4">
              {/* Same form fields as Add Modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedFacility(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Court Modal */}
      {showCourtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Add Court to {selectedSport?.sport?.name}
            </h2>
            <form onSubmit={handleAddCourt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court Name
                </label>
                <input
                  type="text"
                  value={courtFormData.name}
                  onChange={(e) =>
                    setCourtFormData({ ...courtFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={courtFormData.type}
                    onChange={(e) =>
                      setCourtFormData({ ...courtFormData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={courtFormData.capacity}
                    onChange={(e) =>
                      setCourtFormData({ ...courtFormData, capacity: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surface
                </label>
                <input
                  type="text"
                  value={courtFormData.surface}
                  onChange={(e) =>
                    setCourtFormData({ ...courtFormData, surface: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Hard court, Clay, Grass"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={courtFormData.hourlyRate}
                  onChange={(e) =>
                    setCourtFormData({ ...courtFormData, hourlyRate: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourtModal(false);
                    setSelectedFacility(null);
                    setSelectedSport(null);
                    resetCourtForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Court
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
