export type ValidationTypes = 'Accepted' | 'Accepted and Violation Sent';
export interface ValidationStatus {
  status: ValidationTypes;
}
