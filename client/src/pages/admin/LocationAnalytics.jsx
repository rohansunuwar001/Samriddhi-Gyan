import React, { useState, useMemo } from "react";
import { useGetLocationStatsQuery } from "@/features/api/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  MapPin,
  Globe2,
  Globe,
  Users,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Fingerprint,
  Calendar,
  UserCheck,
  AlertCircle
} from "lucide-react";
import CountUp from "react-countup";

// --- Loading skeleton component ---
const LocationSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <Skeleton className="h-[450px] w-full" />
  </div>
);

// --- Error display component ---
const ErrorState = ({ error }) => (
  <div className="p-8">
    <Alert variant="destructive" className="border-red-500/50 bg-red-500/5">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <AlertTitle className="text-red-500 font-bold">Error Loading Location Analytics</AlertTitle>
      <AlertDescription className="text-red-600 dark:text-red-400">
        {error?.data?.message || "An unexpected error occurred while fetching geolocation logs."}
      </AlertDescription>
    </Alert>
  </div>
);

// --- Continent Node (Root level of tree) ---
const ContinentNode = ({ continentName, continentData }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Open by default for better visibility

  return (
    <div className="border border-slate-200/80 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm bg-white/70 dark:bg-slate-900/40 backdrop-blur-md transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950 dark:text-slate-100">
              {continentName || "Unknown Continent"}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-light">
              Continent level aggregation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
            {continentData.count} Visit{continentData.count > 1 ? "s" : ""}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/20 space-y-4 pl-6 pr-4 bg-white/20 dark:bg-slate-950/5">
          {Object.entries(continentData.countries).map(([countryCode, countryData]) => (
            <CountryNode key={countryCode} countryCode={countryCode} countryData={countryData} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Country Node inside Continent ---
const CountryNode = ({ countryCode, countryData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-100 dark:border-slate-800/40 rounded-lg overflow-hidden shadow-xs bg-white/40 dark:bg-slate-900/10 transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shadow-xs">
            {countryCode === "Unknown" ? "UN" : countryCode}
          </div>
          <div>
            <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
              {countryCode === "NP" ? "Nepal" : countryCode === "Unknown" ? "Unknown Country" : countryCode}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-light">
              Country Code: {countryCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
            {countryData.count} Visit{countryData.count > 1 ? "s" : ""}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 border-t border-slate-50 dark:border-slate-800/20 space-y-3 pl-6 pr-3 bg-slate-50/20 dark:bg-slate-900/5">
          {Object.entries(countryData.regions).map(([regionName, regionData]) => (
            <RegionNode key={regionName} regionName={regionName} regionData={regionData} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Region/State Node ---
const RegionNode = ({ regionName, regionData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-100/80 dark:border-slate-800/20 rounded-md overflow-hidden bg-white/30 dark:bg-slate-950/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Globe2 className="w-4 h-4 text-slate-400" />
          <span className="font-normal text-xs">{regionName || "Unknown Region"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-medium">
            {regionData.count} area{regionData.count > 1 ? "s" : ""}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 border-t border-slate-50 dark:border-slate-800/10 space-y-2 pl-4 pr-3">
          {Object.entries(regionData.cities).map(([cityName, cityData]) => (
            <CityNode key={cityName} cityName={cityName} cityData={cityData} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- City Node ---
const CityNode = ({ cityName, cityData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-50 dark:border-slate-800/10 rounded bg-white/20 dark:bg-slate-950/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-light text-xs">{cityName || "Unknown City"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">
            {cityData.count} visitor{cityData.count > 1 ? "s" : ""}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-50 dark:border-slate-800/5 divide-y divide-slate-100/50 dark:divide-slate-800/10">
          {cityData.visits.map((visit) => (
            <div key={visit._id} className="p-3 pl-4 space-y-2 hover:bg-slate-50/10 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <Fingerprint className="w-3 h-3 text-slate-400" />
                      {visit.ip}
                    </span>
                    {visit.user ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <UserCheck className="w-2.5 h-2.5" />
                        Registered: {visit.user.name} ({visit.user.role})
                      </span>
                    ) : (
                      <span className="text-[9px] font-normal text-slate-400 bg-slate-100/50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded">
                        Guest Visitor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light font-sans">
                    {visit.formattedAddress}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(visit.visitedAt).toLocaleString()}
                </span>
              </div>
              {visit.latitude && visit.longitude && (
                <div className="text-[10px] text-slate-400 font-mono">
                  Coordinates: {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ====================================================================
// MAIN LOCATION ANALYTICS COMPONENT
// ====================================================================
const LocationAnalytics = () => {
  const { data, isLoading, isError, error } = useGetLocationStatsQuery();

  const stats = data?.stats || {};
  const rawCount = data?.rawCount || 0;

  // Calculate high-level summary indicators
  const totals = useMemo(() => {
    const continents = Object.keys(stats);
    let totalCountries = 0;
    let totalRegions = 0;
    let totalCities = 0;
    let registeredCount = 0;

    continents.forEach((continent) => {
      const countries = Object.keys(stats[continent].countries);
      totalCountries += countries.length;

      countries.forEach((country) => {
        const regions = Object.keys(stats[continent].countries[country].regions);
        totalRegions += regions.length;

        regions.forEach((region) => {
          const cities = Object.keys(stats[continent].countries[country].regions[region].cities);
          totalCities += cities.length;

          cities.forEach((city) => {
            stats[continent].countries[country].regions[region].cities[city].visits.forEach((visit) => {
              if (visit.user) registeredCount++;
            });
          });
        });
      });
    });

    return {
      continentsCount: continents.length,
      countriesCount: totalCountries,
      regionsCount: totalRegions,
      citiesCount: totalCities,
      registeredCount
    };
  }, [stats]);

  if (isLoading) return <LocationSkeleton />;
  if (isError) return <ErrorState error={error} />;

  return (
    <div className="flex-grow space-y-6 p-6 md:p-8 pt-6 min-h-screen bg-slate-50/30 dark:bg-slate-950/20">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
            Geospatial Location Analytics
          </h2>
          <p className="text-sm text-slate-500 font-light">
            Silently resolve, aggregate, and map visitor locations (Continents, Countries, Cities, accurate address) to optimize target demographics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-lg text-emerald-800 dark:text-emerald-400 text-xs font-semibold shadow-sm">
          <TrendingUp className="w-4 h-4" /> Live Tracking Active
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40 backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-light text-slate-500">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-slate-800 dark:text-slate-100">
              <CountUp start={0} end={rawCount} duration={1.5} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Logs recorded platform-wide</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40 backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-light text-slate-500">Unique Continents</CardTitle>
            <Globe className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-slate-800 dark:text-slate-100">
              <CountUp start={0} end={totals.continentsCount} duration={1.5} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Visiting continents</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40 backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-light text-slate-500">Countries & Regions</CardTitle>
            <Globe2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-slate-800 dark:text-slate-100">
              <CountUp start={0} end={totals.countriesCount} duration={1.5} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{totals.regionsCount} Regions, {totals.citiesCount} Cities</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40 backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-light text-slate-500">Registered Users</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-slate-800 dark:text-slate-100">
              <CountUp start={0} end={totals.registeredCount} duration={1.5} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Logged-in location sync profiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical tree drilldown section */}
      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/40 backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
        <CardHeader className="border-b border-slate-200/40 dark:border-slate-800/20 pb-4">
          <CardTitle className="text-lg font-medium text-slate-800 dark:text-slate-100">
            Visitor Demographics Tree
          </CardTitle>
          <CardDescription className="font-light">
            Drill down into continents, countries, states, and cities to inspect specific visitor details.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {Object.keys(stats).length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-600 font-light">
              No geospatial visitor logs found. Active location tracking will log visitors as they arrive.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.entries(stats).map(([continentName, continentData]) => (
                <ContinentNode key={continentName} continentName={continentName} continentData={continentData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalytics;
