import { check } from 'k6';
import http from 'k6/http';

/**
 * Balikobot ADD endpoint schema and validation
 * POST https://apiv2.balikobot.cz/{partner}/add
 */

// ==========================================
// ENDPOINT SCHEMA - REQUEST/RESPONSE TYPES
// ==========================================

export interface PackageRequest {
  // Required fields
  service_type: string;
  rec_name: string;
  rec_country: string;

  // Recipient address data
  rec_firm?: string;
  rec_street?: string;
  rec_city?: string;
  rec_zip?: string;
  rec_phone?: string;
  rec_email?: string;

  // Price data
  price?: number;
  cod_price?: string | number;
  cod_currency?: string;
  ins_currency?: string;

  // Dimensions and weight
  weight?: number;
  length?: number;
  height?: number;
  width?: number;

  // Identification data
  eid?: string;
  vs?: number;
  real_order_id?: string;
  order_number?: number;
  reference?: string;

  // Services and settings
  services?: string;
  return_full_errors?: number;
  branch_id?: string;
  note?: string;
}

export interface AddPackageRequest {
  packages: PackageRequest[];
}

export interface PackageResponse {
  // Request fields echoed back
  eid?: string;
  order_number?: number;

  // Response-specific fields added by API
  carrier_id: string;        // e.g. "DR1536622512M"
  package_id: string;        // e.g. "add-cp-8728035"
  label_url: string;         // e.g. "https://pdf.balikobot.cz/cp/..."
  track_url?: string;        // e.g. "https://www.postaonline.cz/trackandtrace/..."
  status: number;            // e.g. 200

  // Error field (only if error occurs)
  error?: string;
}

export interface AddPackageResponse {
  packages: PackageResponse[];
  labels_url: string;        // e.g. "https://pdf.balikobot.cz/cp/..."
  status: number;            // Overall status e.g. 200
}

export interface BalikobotApiConfig {
  partner: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AddEndpointResult {
  success: boolean;
  response: any;
  packageIds: string[];
  statusCode: number;
  duration: number;
}

// ==========================================
// CONFIGURATION FUNCTIONS
// ==========================================

/**
 * Creates configuration for Balikobot API
 */
export function createBalikobotConfig(
  partner?: string,
  apiKey?: string,
  baseUrl?: string
): BalikobotApiConfig {
  return {
    partner: partner || (globalThis as any).__ENV?.PARTNER || "cp",
    apiKey: apiKey || (globalThis as any).__ENV?.API_KEY || "YOUR_API_KEY",
    baseUrl: baseUrl || "https://apiv2.balikobot.cz"
  };
}

/**
 * Creates HTTP headers for Balikobot API
 */
export function createBalikobotHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };
}

// ==========================================
// PACKAGE CREATION FUNCTIONS
// ==========================================

/**
 * Creates basic package request for testing
 */
export function createTestPackage(overrides: Partial<PackageRequest> = {}): PackageRequest {
  return {
    eid: "5914356836",
    service_type: "DR",
    rec_name: "Test Testovací",
    rec_country: "CZ",
    rec_firm: "",
    rec_phone: "+420777976117",
    rec_email: "lukas@balikobot.cz",
    rec_street: "Revoluční 16",
    rec_city: "Praha",
    rec_zip: "11000",
    price: 1000,
    cod_price: "100.00",
    cod_currency: "CZK",
    ins_currency: "",
    weight: 1.2,
    order_number: 1,
    vs: 20157595,
    real_order_id: "BB1234",
    length: 123.5,
    height: 128.5,
    width: 179.9,
    services: "1+S",
    return_full_errors: 1,
    reference: "XCD2345",
    ...overrides
  };
}

/**
 * Creates random package for testing
 */
export function createRandomPackage(): PackageRequest {
  const names = ["Jan Novak", "Petra Svoboda", "Tomáš Dvořák", "Anna Krásná"];
  const cities = ["Praha", "Brno", "Ostrava", "Plzeň"];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];

  return createTestPackage({
    rec_name: randomName,
    rec_city: randomCity,
    price: Math.floor(Math.random() * 10000) + 1000,
    cod_price: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) + 500 : undefined,
    eid: `RAND${Math.floor(Math.random() * 999999)}`
  });
}

// ==========================================
// API CALL FUNCTIONS
// ==========================================

/**
 * Main function for calling ADD endpoint
 */
export function addPackages(
  config: BalikobotApiConfig,
  packages: PackageRequest[]
): AddEndpointResult {
  const url = `${config.baseUrl}/${config.partner}/add`;

  const payload: AddPackageRequest = { packages };
  const headers = createBalikobotHeaders(config.apiKey);

  const startTime = Date.now();
  const response = http.post(url, JSON.stringify(payload), { headers });
  const duration = Date.now() - startTime;

  const success = response.status === 200;
  let packageIds: string[] = [];

  if (success && response.body) {
    try {
      const responseData = JSON.parse(response.body as string) as AddPackageResponse;
      packageIds = responseData.packages?.map(pkg => pkg.package_id).filter(id => id) as string[] || [];
    } catch (error) {
      console.error('Failed to parse response:', error);
    }
  }

  return {
    success,
    response: response.body,
    packageIds,
    statusCode: response.status,
    duration
  };
}

/**
 * Adds single package
 */
export function addSinglePackage(
  config: BalikobotApiConfig,
  packageData: PackageRequest
): AddEndpointResult {
  return addPackages(config, [packageData]);
}

/**
 * Adds packages with console logging
 */
export function addPackagesWithLogging(
  config: BalikobotApiConfig,
  packages: PackageRequest[],
  logResults: boolean = true
): AddEndpointResult {
  if (logResults) {
    console.log(`📦 Adding ${packages.length} package(s) to ${config.partner.toUpperCase()}...`);
  }

  const result = addPackages(config, packages);

  if (logResults) {
    if (result.success) {
      console.log(`✅ Successfully added ${result.packageIds.length} package(s)`);
      console.log(`📊 Duration: ${result.duration}ms`);
      console.log(`🔢 Package IDs: ${result.packageIds.join(', ')}`);
    } else {
      console.log(`❌ Failed to add packages: ${result.statusCode}`);
      console.log(`📄 Response: ${result.response}`);
    }
  }

  return result;
}

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validates ADD endpoint response
 */
export function validateAddResponse(
  result: AddEndpointResult,
  expectedPackageCount: number = 1
): boolean {
  const responseData = JSON.parse(result.response as string) as AddPackageResponse;

  return check(result, {
    'ADD endpoint returns 200': () => result.statusCode === 200,
    'ADD endpoint is successful': () => result.success,
    'Response contains package IDs': () => result.packageIds.length > 0,
    'Package count matches expected': () => result.packageIds.length === expectedPackageCount,
    'Response time under 5s': () => result.duration < 5000,
    'Response contains labels_url': () => responseData.labels_url !== undefined,
    'Each package has carrier_id': () => responseData.packages.every(pkg => pkg.carrier_id),
    'Each package has track_url': () => responseData.packages.every(pkg => pkg.track_url),
    'Each package has label_url': () => responseData.packages.every(pkg => pkg.label_url),
    'Response status is 200': () => responseData.status === 200,
  });
}

// ==========================================
// TEST PATTERNS
// ==========================================

/**
 * Preconfigured test packages for different scenarios
 */
export const TEST_PACKAGES = {
  // Basic CZ package
  BASIC_CZ: createTestPackage(),

  // Package with higher COD
  COD_PACKAGE: createTestPackage({
    cod_price: "1500.00",
    cod_currency: "CZK",
    eid: "COD123456"
  }),

  // Package without COD
  NO_COD: createTestPackage({
    cod_price: undefined,
    cod_currency: undefined,
    eid: "NOCOD123"
  }),

  // Package with insurance
  INSURED: createTestPackage({
    price: 10000,
    ins_currency: "CZK",
    eid: "INS123456"
  }),

  // Heavy package
  HEAVY_PACKAGE: createTestPackage({
    weight: 5.0,
    length: 300,
    height: 200,
    width: 250,
    price: 8000,
    eid: "HEAVY123"
  }),

  // Express package
  EXPRESS_PACKAGE: createTestPackage({
    service_type: "RR",
    services: "1+2+S",
    eid: "EXP123456"
  })
};

// ==========================================
// FIELD VALIDATION SCHEMA
// ==========================================

/**
 * Schema defining expected types for each field in PackageRequest
 * Based on real API specification: POST https://apiv2.balikobot.cz/cp/add
 */
export const PACKAGE_REQUEST_FIELD_SCHEMA = {
  // Required fields - must be strings
  service_type: 'string',
  rec_name: 'string',
  rec_country: 'string',

  // Recipient address data - all strings
  rec_firm: 'string',
  rec_street: 'string',
  rec_city: 'string',
  rec_zip: 'string',
  rec_phone: 'string',
  rec_email: 'string',

  // Price data - numbers and strings
  price: 'number',
  cod_price: 'string|number',  // Can be "100.00" or 100
  cod_currency: 'string',
  ins_currency: 'string',

  // Dimensions and weight - all numbers
  weight: 'number',
  length: 'number',
  height: 'number',
  width: 'number',

  // Identification data - mixed types
  eid: 'string',
  vs: 'number',
  real_order_id: 'string',
  order_number: 'number',
  reference: 'string',

  // Services and settings - mixed types
  services: 'string',           // e.g. "1+S", "1+2+S"
  return_full_errors: 'number', // 1 or 0 (boolean as number)
  branch_id: 'string',
  note: 'string'
} as const;

/**
 * Required fields that must be present in every request
 */
export const REQUIRED_FIELDS = ['service_type', 'rec_name', 'rec_country'] as const;

// ==========================================
// FIELD TYPE VALIDATION FUNCTIONS
// ==========================================

/**
 * Validates if a value matches expected type(s)
 */
export function validateFieldType(value: any, expectedType: string): boolean {
  if (value === undefined || value === null) {
    return true; // Optional fields can be undefined
  }

  // Handle union types like 'string|number'
  if (expectedType.includes('|')) {
    const types = expectedType.split('|');
    return types.some(type => validateSingleType(value, type.trim()));
  }

  return validateSingleType(value, expectedType);
}

/**
 * Validates a single type
 */
function validateSingleType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

/**
 * Validates all fields in a PackageRequest against the schema
 */
export function validatePackageRequestFields(packageRequest: Partial<PackageRequest>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in packageRequest) || packageRequest[field as keyof PackageRequest] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate field types
  for (const [fieldName, value] of Object.entries(packageRequest)) {
    if (fieldName in PACKAGE_REQUEST_FIELD_SCHEMA) {
      const expectedType = PACKAGE_REQUEST_FIELD_SCHEMA[fieldName as keyof typeof PACKAGE_REQUEST_FIELD_SCHEMA];

      if (!validateFieldType(value, expectedType)) {
        errors.push(`Field '${fieldName}' should be ${expectedType}, got ${typeof value} (value: ${JSON.stringify(value)})`);
      }
    } else {
      warnings.push(`Unknown field '${fieldName}' not in schema`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates an array of packages
 */
export function validatePackagesArray(packages: Partial<PackageRequest>[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  packageResults: Array<{ index: number; isValid: boolean; errors: string[]; warnings: string[]; }>;
} {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const packageResults: Array<{ index: number; isValid: boolean; errors: string[]; warnings: string[]; }> = [];

  if (!Array.isArray(packages)) {
    allErrors.push('Packages must be an array');
    return {
      isValid: false,
      errors: allErrors,
      warnings: allWarnings,
      packageResults
    };
  }

  if (packages.length === 0) {
    allErrors.push('Packages array cannot be empty');
  }

  packages.forEach((pkg, index) => {
    const result = validatePackageRequestFields(pkg);
    packageResults.push({
      index,
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings
    });

    // Add errors with package index
    result.errors.forEach(error => {
      allErrors.push(`Package ${index}: ${error}`);
    });
    result.warnings.forEach(warning => {
      allWarnings.push(`Package ${index}: ${warning}`);
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    packageResults
  };
}

/**
 * Validates complete ADD request payload
 */
export function validateAddRequest(payload: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check payload structure
  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { isValid: false, errors, warnings };
  }

  if (!('packages' in payload)) {
    errors.push('Payload must contain "packages" field');
    return { isValid: false, errors, warnings };
  }

  // Validate packages
  const packagesValidation = validatePackagesArray(payload.packages);
  errors.push(...packagesValidation.errors);
  warnings.push(...packagesValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ==========================================
// K6 CHECK VALIDATION FUNCTIONS
// ==========================================

/**
 * K6 check function for validating request before sending
 */
export function validateRequestForK6(payload: any, testName: string = 'Request validation'): boolean {
  const validation = validateAddRequest(payload);

  const result = check(validation, {
    [`${testName} - Request structure is valid`]: () => validation.isValid,
    [`${testName} - No validation errors`]: () => validation.errors.length === 0,
  });

  // Log validation details
  if (!validation.isValid) {
    console.error(`❌ ${testName} validation failed:`);
    validation.errors.forEach(error => console.error(`   - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.warn(`⚠️  ${testName} validation warnings:`);
    validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  return result;
}

/**
 * Validates that response fields match expected types
 */
export function validateResponseFieldTypes(response: any): boolean {
  if (!response || !response.packages || !Array.isArray(response.packages)) {
    return false;
  }

  return check(response, {
    'Response has packages array': () => Array.isArray(response.packages),
    'Response status is number': () => typeof response.status === 'number' || response.status === undefined,
    'Response labels_url is string': () => typeof response.labels_url === 'string' || response.labels_url === undefined,
    'Package IDs are strings': () => response.packages.every((pkg: any) =>
      typeof pkg.package_id === 'string' || pkg.package_id === undefined
    ),
    'Carrier IDs are strings': () => response.packages.every((pkg: any) =>
      typeof pkg.carrier_id === 'string' || pkg.carrier_id === undefined
    ),
    'Label URLs are strings': () => response.packages.every((pkg: any) =>
      typeof pkg.label_url === 'string' || pkg.label_url === undefined
    ),
    'Package statuses are numbers': () => response.packages.every((pkg: any) =>
      typeof pkg.status === 'number' || pkg.status === undefined
    )
  });
}
