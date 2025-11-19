import apiClient from "../lib/apiClient";
import { GOONG_API_KEY } from "@env";

export async function getProvinces() {
  return await apiClient.get(`/provinces`);
}

export async function getDistricts(provinceId: string) {
  return await apiClient.get(`/districts/${provinceId}`);
}

export async function getWards(districtId: string) {
  return await apiClient.get(`/wards/${districtId}`);
}

// Geocode an address using Goong API
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
} | null> {
  try {
    if (!GOONG_API_KEY) {
      console.error("❌ [geocodeAddress] Missing GOONG_API_KEY");
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://rsapi.goong.io/Geocode?address=${encodedAddress}&api_key=${GOONG_API_KEY}`;

    console.log("🌍 [geocodeAddress] Fetching geocode for:", address);

    const response = await fetch(url);

    if (!response.ok) {
      console.error("❌ [geocodeAddress] API request failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;

      console.log("✅ [geocodeAddress] Geocoded successfully:", { lat, lng });

      return {
        lat,
        lng,
        formattedAddress: result.formatted_address || address,
      };
    }

    console.warn("⚠️ [geocodeAddress] No results found for address");
    return null;
  } catch (error) {
    console.error("❌ [geocodeAddress] Error:", error);
    return null;
  }
}

// Reverse geocode coordinates to address using Goong API with retry logic
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
  maxRetries: number = 3
): Promise<{
  formattedAddress: string;
  lat: number;
  lng: number;
} | null> {
  if (!GOONG_API_KEY) {
    console.error("❌ [reverseGeocodeCoordinates] Missing GOONG_API_KEY");
    return null;
  }

  const url = `https://rsapi.goong.io/Geocode?latlng=${latitude},${longitude}&api_key=${GOONG_API_KEY}`;

  console.log("🌍 [reverseGeocodeCoordinates] Fetching address for:", {
    latitude,
    longitude,
  });
  console.log("🔗 [reverseGeocodeCoordinates] URL:", url);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔄 [reverseGeocodeCoordinates] Attempt ${attempt}/${maxRetries}`
      );

      // Add timeout to prevent hanging (same as web version timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      console.log(
        "📡 [reverseGeocodeCoordinates] Response status:",
        response.status
      );

      if (!response.ok) {
        const errorText = await response.text();
        const isHtml =
          errorText.trim().startsWith("<!DOCTYPE") ||
          errorText.trim().startsWith("<html");

        console.error("❌ [reverseGeocodeCoordinates] API request failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: isHtml
            ? "HTML error page (server error)"
            : errorText.substring(0, 200),
        });

        // Retry on server errors (500, 502, 503, 504)
        if (response.status >= 500 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(
            `⏳ [reverseGeocodeCoordinates] Waiting ${waitTime}ms before retry...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        return null;
      }

      const data = await response.json();
      console.log(
        "📦 [reverseGeocodeCoordinates] Response data:",
        JSON.stringify(data, null, 2)
      );

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const formattedAddress = result.formatted_address || "";

        console.log(
          "✅ [reverseGeocodeCoordinates] Reverse geocoded successfully:",
          {
            formattedAddress,
          }
        );

        return {
          formattedAddress,
          lat: latitude,
          lng: longitude,
        };
      }

      console.warn(
        "⚠️ [reverseGeocodeCoordinates] No results found for coordinates"
      );
      return null;
    } catch (error: any) {
      console.error(
        `❌ [reverseGeocodeCoordinates] Attempt ${attempt} failed:`,
        error.message
      );

      // Handle timeout/abort
      if (error.name === "AbortError") {
        console.error("⏱️ [reverseGeocodeCoordinates] Request timeout (15s)");
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(
          `⏳ [reverseGeocodeCoordinates] Waiting ${waitTime}ms before retry...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      return null;
    }
  }

  console.error("❌ [reverseGeocodeCoordinates] All retry attempts failed");
  return null;
}

// Build a full address string from components
export function buildAddressString(
  specificAddress?: string,
  wardName?: string,
  districtName?: string,
  provinceName?: string
): string {
  const parts: string[] = [];

  if (specificAddress) parts.push(specificAddress);
  if (wardName) parts.push(wardName);
  if (districtName) parts.push(districtName);
  if (provinceName) parts.push(provinceName);

  return parts.join(", ");
}
