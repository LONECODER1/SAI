import { NextResponse } from "next/server";
import { calculateRoute, geocodeAddress, reverseGeocode } from "@/lib/algorithms/geo-routing";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startLat = parseFloat(searchParams.get("startLat"));
    const startLng = parseFloat(searchParams.get("startLng"));
    const endLat = parseFloat(searchParams.get("endLat"));
    const endLng = parseFloat(searchParams.get("endLng"));
    const mode = searchParams.get("mode") || "driving";
    const startName = searchParams.get("startName") || "Origin";
    const endName = searchParams.get("endName") || "Destination";

    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      return NextResponse.json(
        { error: "Valid numeric query params (startLat, startLng, endLat, endLng) are required" },
        { status: 400 }
      );
    }

    const route = await calculateRoute({
      startLat,
      startLng,
      endLat,
      endLng,
      startName,
      endName,
      mode,
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      startLat,
      startLng,
      endLat,
      endLng,
      mode = "driving",
      startName = "Origin",
      endName = "Destination",
    } = body;

    if (
      startLat === undefined ||
      startLng === undefined ||
      endLat === undefined ||
      endLng === undefined
    ) {
      return NextResponse.json(
        { error: "startLat, startLng, endLat, and endLng are required" },
        { status: 400 }
      );
    }

    const route = await calculateRoute({
      startLat: Number(startLat),
      startLng: Number(startLng),
      endLat: Number(endLat),
      endLng: Number(endLng),
      startName,
      endName,
      mode,
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
