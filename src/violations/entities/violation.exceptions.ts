import { Violation, ViolationStatus } from './violation.entity';

export interface ViolationException {
  getViolation(): Violation;
  getMessage(): string;
}

export class ViolationStatusException
  extends Error
  implements ViolationException
{
  private violation: Violation;

  constructor(
    violation: Violation,
    targetStatus: ViolationStatus,
    message?: string,
  ) {
    const originalStatus = violation.status || 'empty';
    super(
      message ||
        `violation_cannot_change_status_from_${originalStatus}_to_${targetStatus}`.toUpperCase(),
    );
    this.violation = violation;
  }

  getViolation(): Violation {
    return this.violation;
  }

  getMessage(): string {
    return this.message;
  }
}

export class ViolationPublishingException
  extends Error
  implements ViolationException
{
  private violation: Violation;

  constructor(violation: Violation, message: string) {
    super(message);
    this.violation = violation;
  }

  public static forInvalidPublishedState(
    violation: Violation,
  ): ViolationPublishingException {
    const publishedStatus = violation.isPublished ? 'PUBLISHED' : 'UNPUBLISHED';

    return new ViolationPublishingException(
      violation,
      `VIOLATION_IS_ALREADY_${publishedStatus}`,
    );
  }

  public static forInvalidStatus(
    violation: Violation,
  ): ViolationPublishingException {
    const status = violation.status.toUpperCase();
    return new ViolationPublishingException(
      violation,
      `VIOLATION_CANNOT_BE_PUBLISHED_WHEN_${status}`,
    );
  }

  getViolation(): Violation {
    return this.violation;
  }

  getMessage(): string {
    return this.message;
  }
}
