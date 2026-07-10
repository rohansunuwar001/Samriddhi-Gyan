import geoip from "geoip-lite";
import { countries } from "countries-list";

// Continent code to name mapping
export const getContinentName = (code) => {
  const continents = {
    AF: "Africa",
    AN: "Antarctica",
    AS: "Asia",
    EU: "Europe",
    NA: "North America",
    OC: "Oceania",
    SA: "South America"
  };
  return continents[code] || "Unknown";
};

/**
 * Resolves an IP address to coarse location details using geoip-lite.
 * Defaults to Kathmandu, Nepal for local loopbacks / private IPs for dev testing.
 */
export const lookupIPLocation = (ipAddress) => {
  if (!ipAddress) {
    return {
      continent: "Unknown",
      country: "Unknown",
      region: "Unknown",
      city: "Unknown"
    };
  }

  // Clean the IP address (handling forward proxies)
  let cleanIp = ipAddress.split(",")[0].trim();

  // If local IPv4/IPv6 loopback or private range, return Kathmandu mock data for easy dev testing
  if (
    cleanIp === "::1" ||
    cleanIp === "127.0.0.1" ||
    cleanIp.startsWith("::ffff:127.0.0.1") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("172.16.")
  ) {
    return {
      continent: "Asia",
      country: "NP", // Nepal
      region: "Bagmati",
      city: "Kathmandu",
      latitude: 27.7172,
      longitude: 85.3240
    };
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (!geo) {
      return {
        continent: "Unknown",
        country: "Unknown",
        region: "Unknown",
        city: "Unknown"
      };
    }

    const countryCode = geo.country || "Unknown";
    const continentCode = countries[countryCode]?.continent || "Unknown";
    const continent = getContinentName(continentCode);

    return {
      continent,
      country: countryCode,
      region: geo.region || "Unknown",
      city: geo.city || "Unknown",
      latitude: geo.ll ? geo.ll[0] : undefined,
      longitude: geo.ll ? geo.ll[1] : undefined
    };
  } catch (err) {
    console.error("Error resolving IP location details:", err.message);
    return {
      continent: "Unknown",
      country: "Unknown",
      region: "Unknown",
      city: "Unknown"
    };
  }
};
