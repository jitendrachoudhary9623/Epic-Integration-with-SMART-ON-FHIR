/**
 * Core FHIR R4 Type Definitions
 */

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface Bundle<T = FHIRResource> {
  resourceType: 'Bundle';
  type: 'searchset' | 'transaction' | 'batch' | 'history' | 'document' | 'message' | 'collection';
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource: T;
    search?: {
      mode: 'match' | 'include' | 'outcome';
      score?: number;
    };
  }>;
}

export interface Patient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  telecom?: Array<{
    system?: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface MedicationRequest extends FHIRResource {
  resourceType: 'MedicationRequest';
  status: string;
  intent: string;
  medicationCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  authoredOn?: string;
  dosageInstruction?: Array<{
    text?: string;
    timing?: any;
    route?: any;
    doseAndRate?: any[];
  }>;
}

export interface Observation extends FHIRResource {
  resourceType: 'Observation';
  status: string;
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  issued?: string;
  valueQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  valueCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  component?: Array<{
    code: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    valueQuantity?: {
      value?: number;
      unit?: string;
    };
  }>;
}

export interface Appointment extends FHIRResource {
  resourceType: 'Appointment';
  status: string;
  serviceType?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  description?: string;
  start?: string;
  end?: string;
  participant?: Array<{
    actor?: {
      reference?: string;
      display?: string;
    };
    status?: string;
  }>;
}

export interface Encounter extends FHIRResource {
  resourceType: 'Encounter';
  status: string;
  class?: {
    system?: string;
    code?: string;
    display?: string;
  };
  type?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  subject: {
    reference: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
}

export interface Procedure extends FHIRResource {
  resourceType: 'Procedure';
  status: string;
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  performedDateTime?: string;
  performedPeriod?: {
    start?: string;
    end?: string;
  };
}

export interface OperationOutcome extends FHIRResource {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    diagnostics?: string;
    details?: {
      text?: string;
    };
  }>;
}
