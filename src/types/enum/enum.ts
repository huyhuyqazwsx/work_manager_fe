// ================= USER =================

export enum UserStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    NONE = "NONE",
}

export enum UserRole {
    EMPLOYEE = "EMPLOYEE",
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD",
    HR = "HR",
    BOD = "BOD",
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
}

export enum ContractType {
    INTERN = "INTERN",
    TRAINEE = "TRAINEE",
    PROBATION = "PROBATION",
    OFFICIAL_EMPLOYEE = "OFFICIAL_EMPLOYEE",
}

// ================= LEAVE =================

export enum LeaveRequestStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
}

export enum LeaveTypeCode {
    ANNUAL = "ANNUAL_LEAVE",
    COMPENSATORY = "COMPENSATORY_LEAVE",
    PAID_PERSONAL = "PAID_PERSONAL_LEAVE",
    SOCIAL_INSURANCE = "SOCIAL_INSURANCE_LEAVE",
}

export enum PaidPersonalEventCode {
    SELF_MARRIAGE = "SELF_MARRIAGE",
    CHILD_MARRIAGE = "CHILD_MARRIAGE",
    FUNERAL = "FUNERAL",
}

// ================= HOLIDAY =================

export enum HolidayType {
    FIXED = "FIXED",
    CUSTOM = "CUSTOM",
}

export enum HolidaySession {
    FULL = "FULL",
    MORNING = "MORNING",
    AFTERNOON = "AFTERNOON",
}

// ================= OT =================

export enum OTType {
    COMPENSATION = "COMPENSATION",
    SALARY = "SALARY",
}

export enum OTPlanStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export enum OTTicketStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
}

export enum CompensationTransactionType {
    EARNED = "EARNED",
    USED = "USED",
}

// ================= EMAIL =================

export enum EmailType {
    INVITE = "INVITE",
}

// ================= ERROR =================

export enum AppError {
    NOT_FOUND = "NOT_FOUND",
    AUTH_FORBIDDEN = "AUTH_FORBIDDEN",
    AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
    BAD_REQUEST = "BAD_REQUEST",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
    VALIDATION_ERROR = "VALIDATION_ERROR",

    USER_NOT_FOUND = "USER_NOT_FOUND",
    LEAVE_NOT_FOUND = "LEAVE_NOT_FOUND",
    OT_PLAN_INVALID_STATUS = "OT_PLAN_INVALID_STATUS",
    LEAVE_INVALID_STATUS = "LEAVE_INVALID_STATUS",
    LEAVE_TYPE_NOT_FOUND = "LEAVE_TYPE_NOT_FOUND",
    LEAVE_INVALID_DATE_RANGE = "LEAVE_INVALID_DATE_RANGE",
    DEPARTMENT_NOT_FOUND = "DEPARTMENT_NOT_FOUND",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN",
    OT_PLAN_NOT_FOUND = "OT_PLAN_NOT_FOUND",
    OT_PLAN_FORBIDDEN = "OT_PLAN_FORBIDDEN",
    OT_TICKET_NOT_FOUND = "OT_TICKET_NOT_FOUND",
    OT_TICKET_FORBIDDEN = "OT_TICKET_FORBIDDEN",
    OT_TICKET_INVALID_STATUS = "OT_TICKET_INVALID_STATUS",
    POLICY_NOT_FOUND = "POLICY_NOT_FOUND",
}