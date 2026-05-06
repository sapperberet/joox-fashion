type BostaAddressInput = {
  city: string;
  district: string;
  firstLine: string;
  secondLine?: string | null;
  buildingNumber?: string | null;
  floor?: string | null;
  apartment?: string | null;
};

type BostaDeliveryInput = {
  orderId: string;
  customerName: string;
  phone: string;
  notes?: string | null;
  codAmount: number;
  goodsValue: number;
  itemsCount: number;
  itemsDescription: string;
  address: BostaAddressInput;
};

export type BostaDeliveryResult = {
  deliveryId?: string;
  trackingNumber?: string;
  businessReference?: string;
  state?: string;
  error?: string;
};

const BOSTA_API_BASE = "https://app.bosta.co/api/v2";
const EGYPT_COUNTRY_ID = "60e4482c7cb7d4bc4849c4d5";

function getBostaConfig() {
  return {
    apiKey: process.env.BOSTA_API_KEY ?? "",
    businessLocationId: process.env.BOSTA_BUSINESS_LOCATION_ID ?? "",
    webhookUrl: process.env.BOSTA_WEBHOOK_URL ?? "",
    packageType: process.env.BOSTA_PACKAGE_TYPE ?? "Parcel",
    packageSize: process.env.BOSTA_PACKAGE_SIZE ?? "MEDIUM",
  };
}

function safeLower(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidates = [
      record.data,
      record.list,
      record.result,
      record.results,
      record.cities,
      record.districts,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        if (Array.isArray(nested.data)) {
          return nested.data;
        }
        if (Array.isArray(nested.list)) {
          return nested.list;
        }
      }
    }
  }

  return [];
}

async function fetchBosta<T>(
  path: string,
  apiKey: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BOSTA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Bosta request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

async function resolveCityId(city: string, apiKey: string) {
  const payload = await fetchBosta<unknown>(
    `/cities?countryId=${EGYPT_COUNTRY_ID}`,
    apiKey,
  );
  const cities = extractArray(payload) as Array<Record<string, unknown>>;
  const target = safeLower(city);

  const matched = cities.find((entry) => {
    const name = safeLower(String(entry.name ?? ""));
    const other = safeLower(String(entry.otherName ?? entry.nameAr ?? ""));
    return name === target || other === target;
  });

  return matched ? String(matched._id ?? matched.id ?? "") : "";
}

async function resolveDistrict(
  cityId: string,
  district: string,
  apiKey: string,
) {
  const payload = await fetchBosta<unknown>(
    `/cities/${cityId}/districts`,
    apiKey,
  );
  const districts = extractArray(payload) as Array<Record<string, unknown>>;
  const target = safeLower(district);

  const matched = districts.find((entry) => {
    const name = safeLower(String(entry.districtName ?? entry.name ?? ""));
    const other = safeLower(String(entry.districtOtherName ?? ""));
    return name === target || other === target;
  });

  if (!matched) {
    return { districtId: "", zoneId: "" };
  }

  return {
    districtId: String(matched.districtId ?? matched._id ?? ""),
    zoneId: String(matched.zoneId ?? ""),
  };
}

function splitName(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export async function createBostaDelivery(
  input: BostaDeliveryInput,
): Promise<BostaDeliveryResult | null> {
  const config = getBostaConfig();
  if (!config.apiKey) {
    return null;
  }

  const cityId = await resolveCityId(input.address.city, config.apiKey);
  if (!cityId) {
    return { error: "Bosta city not found" };
  }

  const { districtId, zoneId } = await resolveDistrict(
    cityId,
    input.address.district,
    config.apiKey,
  );

  if (!districtId) {
    return { error: "Bosta district not found" };
  }

  const { firstName, lastName } = splitName(input.customerName);
  const normalizedPhone = input.phone.replace(/\D/g, "");
  const payload = {
    type: 10,
    specs: {
      packageType: config.packageType,
      size: config.packageSize,
      packageDetails: {
        itemsCount: input.itemsCount,
        description: input.itemsDescription,
      },
    },
    notes: input.notes ?? undefined,
    cod: Number.isFinite(input.codAmount) ? input.codAmount : 0,
    goodsInfo: {
      amount: Number.isFinite(input.goodsValue) ? input.goodsValue : 0,
    },
    dropOffAddress: {
      city: input.address.city,
      districtId,
      zoneId: zoneId || undefined,
      firstLine: input.address.firstLine,
      secondLine: input.address.secondLine || undefined,
      buildingNumber: input.address.buildingNumber || undefined,
      floor: input.address.floor || undefined,
      apartment: input.address.apartment || undefined,
      isWorkAddress: false,
    },
    businessReference: input.orderId,
    uniqueBusinessReference: input.orderId,
    receiver: {
      firstName,
      lastName: lastName || undefined,
      fullName: input.customerName,
      phone: normalizedPhone || input.phone,
    },
    allowToOpenPackage: false,
    businessLocationId: config.businessLocationId || undefined,
    webhookUrl: config.webhookUrl || undefined,
  };

  try {
    const response = await fetchBosta<{
      success?: boolean;
      message?: string;
      data?: Record<string, unknown>;
    }>("/deliveries?apiVersion=1", config.apiKey, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response?.success) {
      return { error: response?.message ?? "Bosta delivery failed" };
    }

    const data = response.data ?? {};
    return {
      deliveryId: String(data._id ?? ""),
      trackingNumber: String(data.trackingNumber ?? ""),
      businessReference: String(data.businessReference ?? ""),
      state: String((data.state as { value?: string })?.value ?? ""),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Bosta delivery failed",
    };
  }
}
