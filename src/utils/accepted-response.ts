export const ACCEPTED_RESPONSE_STATUS = 'Accepted'
export type AcceptedStatuses = 'Accepted'

/**
 * Useful when returnin HTTP code 202 Accepted or similar responses without other useful contentful responses,
 * but would still like to acknowledge the success of the request.
 */
export interface AcceptedResponse {
  status: AcceptedStatuses
}
