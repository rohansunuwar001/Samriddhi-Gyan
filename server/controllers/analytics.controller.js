import { Visitor } from "../models/visitor.model.js";
import { lookupIPLocation } from "../utils/geoLookup.js";

/**
 * Silently records a user/guest visit with resolved IP location or client-passed details.
 */
export const trackVisit = async (req, res) => {
  try {
    const { locationDetails } = req.body;
    // req.user is populated if token is verified (handled by optionalAuth middleware)
    const userId = req.user?._id || null;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Call server-side IP resolution fallback
    const ipGeo = lookupIPLocation(ip);

    // Merge details: client-supplied coordinates/address takes precedence over IP lookup
    const continent = locationDetails?.continent || ipGeo.continent || "Unknown";
    const country = locationDetails?.country || ipGeo.country || "Unknown";
    const region = locationDetails?.region || ipGeo.region || "Unknown";
    const city = locationDetails?.city || ipGeo.city || "Unknown";
    const formattedAddress =
      locationDetails?.formattedAddress ||
      ipGeo.formattedAddress ||
      `${city}, ${region}, ${country}`;
    const latitude = locationDetails?.latitude || ipGeo.latitude;
    const longitude = locationDetails?.longitude || ipGeo.longitude;

    await Visitor.create({
      ip: ip.split(",")[0].trim(),
      locationDetails: {
        continent,
        country,
        region,
        city,
        formattedAddress,
        latitude,
        longitude
      },
      user: userId
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Analytics Controller] trackVisit Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Aggregates visit logs hierarchically: Continent -> Country -> Region -> City -> Detailed User list.
 */
export const getLocationStats = async (req, res) => {
  try {
    const visitors = await Visitor.find({})
      .populate("user", "name email role")
      .sort({ visitedAt: -1 })
      .lean();

    const hierarchy = {};

    visitors.forEach((visitor) => {
      const details = visitor.locationDetails || {};
      const continent = details.continent || "Unknown";
      const country = details.country || "Unknown";
      const region = details.region || "Unknown";
      const city = details.city || "Unknown";

      if (!hierarchy[continent]) {
        hierarchy[continent] = {
          count: 0,
          countries: {}
        };
      }
      hierarchy[continent].count++;

      if (!hierarchy[continent].countries[country]) {
        hierarchy[continent].countries[country] = {
          count: 0,
          regions: {}
        };
      }
      hierarchy[continent].countries[country].count++;

      if (!hierarchy[continent].countries[country].regions[region]) {
        hierarchy[continent].countries[country].regions[region] = {
          count: 0,
          cities: {}
        };
      }
      hierarchy[continent].countries[country].regions[region].count++;

      if (!hierarchy[continent].countries[country].regions[region].cities[city]) {
        hierarchy[continent].countries[country].regions[region].cities[city] = {
          count: 0,
          visits: []
        };
      }
      hierarchy[continent].countries[country].regions[region].cities[city].count++;

      hierarchy[continent].countries[country].regions[region].cities[city].visits.push({
        _id: visitor._id,
        ip: visitor.ip,
        formattedAddress: details.formattedAddress || `${city}, ${region}, ${country}`,
        latitude: details.latitude,
        longitude: details.longitude,
        user: visitor.user,
        visitedAt: visitor.visitedAt
      });
    });

    return res.status(200).json({
      success: true,
      stats: hierarchy,
      rawCount: visitors.length
    });
  } catch (error) {
    console.error("[Analytics Controller] getLocationStats Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
