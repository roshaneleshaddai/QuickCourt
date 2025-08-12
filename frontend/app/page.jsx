"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Star,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { sportsAPI, facilitiesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import Header from "@/components/Header";

export default function Home() {
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedCity, setSelectedCity] = useState("Ahmedabad");

  // Horizontal scrollers
  const facilityScrollRef = useRef(null);
  const sportsScrollRef = useRef(null);

  const scrollByAmount = (ref, amount) => {
    if (!ref?.current) return;
    ref.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  // City suggestions
  const citySuggestions = [
    "Ahmedabad",
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Kolkata",
    "Jaipur",
    "Surat",
    "Lucknow",
    "Indore",
    "Bhopal",
    "Nagpur",
  ];

  // Genre color mapping
  const getGenreClass = (sportName) => {
    const name = sportName?.toLowerCase() || "";
    if (name.includes("badminton")) return "genre-badminton";
    if (name.includes("football") || name.includes("soccer"))
      return "genre-football";
    if (name.includes("cricket")) return "genre-cricket";
    if (name.includes("swimming")) return "genre-swimming";
    if (name.includes("tennis") && !name.includes("table"))
      return "genre-tennis";
    if (name.includes("table tennis") || name.includes("ping pong"))
      return "genre-table-tennis";
    if (name.includes("basketball")) return "genre-basketball";
    if (name.includes("volleyball")) return "genre-volleyball";
    return "genre-default";
  };

  const getTagClass = (sportName) => {
    const name = sportName?.toLowerCase() || "";
    if (name.includes("badminton")) return "tag-badminton";
    if (name.includes("football") || name.includes("soccer"))
      return "tag-football";
    if (name.includes("cricket")) return "tag-cricket";
    if (name.includes("swimming")) return "tag-swimming";
    if (name.includes("tennis") && !name.includes("table")) return "tag-tennis";
    if (name.includes("table tennis") || name.includes("ping pong"))
      return "tag-table-tennis";
    if (name.includes("basketball")) return "tag-basketball";
    if (name.includes("volleyball")) return "tag-volleyball";
    return "bg-gray-500 text-white";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Starting to fetch data from API...");

        // Fetch sports and facilities from the database
        const [sportsData, facilitiesData] = await Promise.all([
          sportsAPI.getAll({ limit: 8 }),
          facilitiesAPI.getAll({
            limit: 6,
            page: 1,
          }),
        ]);

        console.log("Sports API response:", sportsData);
        console.log("Facilities API response:", facilitiesData);

        // Set sports data
        if (sportsData && sportsData.sports) {
          setSports(sportsData.sports);
          console.log("Sports set successfully:", sportsData.sports.length);
        } else {
          console.warn("No sports data received");
          setSports([]);
        }

        // Process and set facilities data
        if (
          facilitiesData &&
          facilitiesData.facilities &&
          Array.isArray(facilitiesData.facilities)
        ) {
          console.log(
            "Processing facilities data:",
            facilitiesData.facilities.length,
            "facilities"
          );

          // Transform the data to match the expected structure
          const processedFacilities = facilitiesData.facilities.map(
            (facility) => {
              console.log("Processing facility:", facility.name, facility);

              // Extract sport information properly
              let primarySport = "General Sports";
              if (facility.sports && facility.sports.length > 0) {
                const firstSport = facility.sports[0];
                if (firstSport.sport && firstSport.sport.name) {
                  primarySport = firstSport.sport.name;
                } else if (typeof firstSport === "string") {
                  primarySport = firstSport;
                }
              }

              return {
                ...facility,
                // Ensure required fields have fallback values
                name: facility.name || "Premium Sports Complex",
                rating: {
                  average: facility.rating?.average || 4.5,
                  count: facility.rating?.count || 0,
                },
                address: {
                  city: facility.address?.city || "Ahmedabad",
                  street: facility.address?.street || "",
                  state: facility.address?.state || "",
                  zipCode: facility.address?.zipCode || "",
                },
                hourlyRate: facility.hourlyRate || 500,
                // Ensure sports array is properly structured
                sports: Array.isArray(facility.sports) ? facility.sports : [],
                // Store the extracted primary sport for easy access
                primarySport: primarySport,
              };
            }
          );

          console.log("Processed facilities:", processedFacilities);
          setFacilities(processedFacilities);
        } else {
          console.warn(
            "No facilities data received or invalid format:",
            facilitiesData
          );
          setFacilities([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load data");
        toast.error("Failed to load data. Please try again later.");
        // Set empty arrays on error to prevent crashes
        setSports([]);
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    // Trigger the useEffect again by updating a dependency
    window.location.reload();
  };

  const handleSearch = () => {
    if (!searchTerm && !selectedSport && !selectedCity) {
      toast.error("Please enter search criteria");
      return;
    }
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedSport) params.set("sport", selectedSport);
    if (selectedCity) params.set("city", selectedCity);
    window.location.href = `/facilities?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-green-600 rounded-full animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">
            Loading amazing experiences...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <Header />

      {/* Hero Section - Centered Layout */}
      <section className="bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="content-center min-h-[60vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
              {/* Left Column - Content */}
              <div className="space-y-8 text-center lg:text-left">
                {/* Location with animation */}
                <div className="flex items-center justify-center lg:justify-start space-x-3 text-gray-600">
                  <MapPin className="h-6 w-6 text-blue-500 pulse-animation" />
                  <span className="font-medium text-lg">{selectedCity}</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full pulse-animation"></span>
                </div>

                {/* Main Heading with gradient */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-green-700 to-green-800 bg-clip-text text-transparent">
                      FIND PLAYERS & VENUES
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent float-animation">
                      NEARBY
                    </span>
                  </h1>
                  <p className="text-gray-600 text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    Seamlessly explore{" "}
                    <span className="font-semibold text-green-600">
                      premium sports venues
                    </span>{" "}
                    and connect with
                    <span className="font-semibold text-green-700">
                      {" "}
                      passionate athletes
                    </span>{" "}
                    just like you!
                  </p>
                </div>

                {/* Mobile Search Form */}
                <div className="lg:hidden bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-lg animate-lift">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 h-5 w-5" />
                    <input
                      type="text"
                      list="city-suggestions"
                      placeholder="Ahmedabad"
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                    />
                    <datalist id="city-suggestions">
                      {citySuggestions.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>

                  <select
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    <option value="">All Sports</option>
                    {sports.map((sport) => (
                      <option key={sport._id} value={sport._id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSearch}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all animate-button shadow-lg"
                  >
                    <Search className="h-5 w-5 mr-2 inline" />
                    Discover Amazing Venues
                  </button>
                </div>
              </div>

              {/* Right Column - Hero Image (Desktop Only) */}
              <div className="hidden lg:block">
                <div className="relative w-full h-96 animate-hover">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-blue-300 float-animation">
                    <div className="text-center text-blue-600">
                      <div className="text-8xl mb-6">🖼</div>
                      <p className="text-2xl font-bold mb-2">Hero Image</p>
                      <p className="text-lg opacity-75">
                        Insert your amazing hero visual here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Search Bar - Fixed Position */}
            <div className="hidden lg:block mt-16 w-full max-w-4xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-3xl p-4 flex items-center gap-4 shadow-2xl animate-lift">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 h-6 w-6 pulse-animation" />
                  <input
                    type="text"
                    list="city-suggestions-desktop"
                    placeholder="Search your city..."
                    className="w-full pl-14 pr-6 py-5 border-0 focus:ring-0 text-gray-900 placeholder-gray-500 rounded-2xl bg-green-50/50 focus:bg-white transition-all text-lg font-medium"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  />
                  <datalist id="city-suggestions-desktop">
                    {citySuggestions.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>

                <select
                  className="px-6 py-5 border-0 focus:ring-0 text-gray-900 bg-green-50 rounded-2xl font-semibold text-lg min-w-[180px] focus:bg-green-100 transition-all"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                >
                  <option value="">🏆 All Sports</option>
                  {sports.map((sport) => (
                    <option key={sport._id} value={sport._id}>
                      {sport.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-green-600 to-green-500 text-white px-10 py-5 rounded-2xl font-bold hover:from-green-700 hover:to-green-600 transition-all animate-button shadow-xl text-lg"
                >
                  <Search className="h-6 w-6 mr-3 inline" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Venues Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="content-center">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 w-full">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                  Book Venues
                </h2>
                <p className="text-gray-600 mt-2">
                  Discover amazing sports facilities
                </p>
              </div>
              <Link
                href="/facilities"
                className="text-green-600 hover:text-green-700 font-semibold text-lg animate-lift px-4 py-2 rounded-full hover:bg-green-50 transition-all"
              >
                See all venues →
              </Link>
            </div>

            <div className="relative w-full">
              {/* Desktop Navigation Arrows */}
              <button
                onClick={() => scrollByAmount(facilityScrollRef, -400)}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-green-600 transition-all animate-scale"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scrollByAmount(facilityScrollRef, 400)}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-green-600 transition-all animate-scale"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Venue Cards */}
              <div
                ref={facilityScrollRef}
                className="responsive-grid lg:flex lg:gap-6 lg:overflow-x-auto lg:no-scrollbar lg:snap-x lg:snap-mandatory lg:pb-4 lg:px-12"
              >
                {loading ? (
                  // Loading skeleton for facilities
                  Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="lg:min-w-[320px] lg:max-w-[320px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse"
                    >
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : facilities.length > 0 ? (
                  facilities.map((facility) => {
                    // Use the processed primary sport from the data
                    const sportName = facility.primarySport || "General Sports";

                    console.log(
                      "Rendering facility:",
                      facility.name,
                      "with sport:",
                      sportName
                    );

                    return (
                      <div
                        key={facility._id}
                        className="lg:min-w-[320px] lg:max-w-[320px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-hover lg:snap-start"
                      >
                        {/* Genre-colored Image Placeholder */}
                        <div
                          className={`h-48 ${getGenreClass(
                            sportName
                          )} flex items-center justify-center relative`}
                        >
                          <div className="text-center text-white">
                            <div className="text-6xl mb-2 float-animation">
                              🖼
                            </div>
                            <p className="font-bold">Venue Image</p>
                            <p className="text-sm opacity-90">
                              {sportName} Facility
                            </p>
                          </div>
                          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                            <div className="flex items-center text-white">
                              <Star className="h-4 w-4 fill-current mr-1" />
                              <span className="font-bold text-sm">
                                {facility.rating?.average || "4.8"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Venue Info */}
                        <div className="p-6">
                          <div className="mb-4">
                            <h3 className="font-bold text-xl text-gray-900 mb-2 hover:text-green-600 transition-colors">
                              {facility.name}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-green-500" />
                              <span>
                                {facility.address?.city || "Ahmedabad"}
                              </span>
                            </div>
                          </div>

                          {/* Genre-based Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-semibold ${getTagClass(
                                sportName
                              )}`}
                            >
                              {sportName}
                            </span>
                            {facility.rating?.average >= 4.5 && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                                Top Rated
                              </span>
                            )}
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-semibold">
                              Premium
                            </span>
                          </div>

                          {/* Book Button with genre colors */}
                          <Link
                            href={`/book/${facility._id}`}
                            className={`block w-full ${getGenreClass(
                              sportName
                            )} text-center py-3 rounded-xl font-bold transition-all animate-button shadow-lg`}
                          >
                            Book Now - ₹{facility.hourlyRate || "500"}/hr
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Fallback when no facilities are available
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">
                      {error ? (
                        <>
                          <div className="text-6xl mb-4">⚠</div>
                          <h3 className="text-xl font-semibold mb-2">
                            Failed to Load Venues
                          </h3>
                          <p className="text-gray-400 mb-4">{error}</p>
                          <button
                            onClick={retryFetch}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Try Again
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-6xl mb-4">🏟</div>
                          <h3 className="text-xl font-semibold mb-2">
                            No Venues Available
                          </h3>
                          <p className="text-gray-400">
                            We're working on adding amazing sports venues. Check
                            back soon!
                          </p>
                          <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Refresh Page
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Popular Sports Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="content-center">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent mb-6">
                🏆 Popular Sports
              </h2>
              <p className="text-gray-700 text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover your passion with our{" "}
                <span className="font-semibold text-green-600">
                  premium sports collection
                </span>
                . Find venues, connect with players, and elevate your game!
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-green-400 mx-auto rounded-full"></div>

              {/* Debug information - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-sm">
                  <h4 className="font-semibold mb-2">Debug Info:</h4>
                  <p>Sports loaded: {sports.length}</p>
                  <p>Facilities loaded: {facilities.length}</p>
                  <p>Loading state: {loading ? "Yes" : "No"}</p>
                  {error && <p className="text-red-600">Error: {error}</p>}
                </div>
              )}
            </div>

            {/* Enhanced Sports Grid */}
            <div className="sports-grid">
              {sports.length > 0 ? (
                sports.map((sport, index) => (
                  <Link
                    key={sport._id}
                    href={`/facilities?sport=${sport.name.toLowerCase()}`}
                    className="sport-card rounded-3xl p-6 group border border-green-100 hover:border-green-300 transition-all duration-500"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="sport-card-content">
                      {/* Sport Icon with Green Background */}
                      <div
                        className={`w-20 h-20 ${getGenreClass(
                          sport.name
                        )} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500`}
                      >
                        <span className="text-4xl">{sport.icon || "🖼"}</span>
                      </div>

                      {/* Sport Info */}
                      <div className="text-center">
                        <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
                          {sport.name}
                        </h3>
                        <p className="text-green-600 font-semibold text-sm mb-3">
                          {sport.venues || "50+"} Venues
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          Find courts & connect with players
                        </p>

                        {/* Interactive Button */}
                        <div className="bg-gradient-to-r from-green-500 to-green-400 text-white px-6 py-2 rounded-full text-sm font-medium group-hover:from-green-600 group-hover:to-green-500 transition-all duration-300 inline-flex items-center">
                          Explore
                          <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                // Show loading or no data state for sports
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold mb-2">
                      Loading Sports...
                    </h3>
                    <p className="text-gray-400">
                      Fetching available sports from the database
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Call-to-Action */}
            <div className="mt-16 text-center">
              <Link
                href="/facilities"
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-green-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-green-700 hover:to-green-600 transition-all animate-button shadow-xl"
              >
                <span className="mr-3">🚀</span>
                Explore All Sports Venues
                <span className="ml-3">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Green Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-green-900 to-gray-800 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="content-center">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent mb-6">
                🚀 Ready to Play?
              </h3>
              <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Join thousands of athletes who have found their perfect sports
                venues through
                <span className="font-semibold text-green-400">
                  {" "}
                  QuickCourt
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-12">
              <div className="animate-lift">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  500+
                </div>
                <div className="text-gray-300 text-lg">Premium Venues</div>
              </div>
              <div className="animate-lift">
                <div className="text-4xl font-bold text-emerald-400 mb-2">
                  10K+
                </div>
                <div className="text-gray-300 text-lg">Active Players</div>
              </div>
              <div className="animate-lift">
                <div className="text-4xl font-bold text-teal-400 mb-2">50+</div>
                <div className="text-gray-300 text-lg">Sports Available</div>
              </div>
              <div className="animate-lift">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  4.8★
                </div>
                <div className="text-gray-300 text-lg">User Rating</div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mb-12">
              <Link
                href="/facilities"
                className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-400 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-green-600 hover:to-green-500 transition-all animate-button shadow-2xl"
              >
                <span className="mr-3">🏆</span>
                Start Playing Today
                <span className="ml-3">→</span>
              </Link>
            </div>

            <div className="pt-8 border-t border-green-700/30 text-center">
              <p className="text-gray-400 text-lg">
                &copy; 2025 QuickCourt. Made with
                <span className="text-green-400 mx-1">💚</span>
                for sports enthusiasts.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
