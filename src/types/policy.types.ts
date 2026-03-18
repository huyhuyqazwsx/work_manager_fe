import { ContractType, PaidPersonalEventCode } from "./enum/enum";

export interface LeaveConfig {
    id: string;
    contractType: ContractType;
    baseDaysPerYear: number;
    bonusDaysPerCycle: number;
    bonusYearCycle: number;
    maxDaysPerRequest: number;
    minimumNoticeDays: number;
    prorateByMonth: boolean;
    joinDateCutoffDay: number;
    allowNegativeBalance: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateLeaveConfigDto extends Omit<LeaveConfig, "id" | "createdAt" | "updatedAt"> { }
export interface UpdateLeaveConfigDto extends Partial<CreateLeaveConfigDto> {
    carryOverDays?: number; // As per backend UpdateLeaveConfigDto
}

export interface OTConfig {
    id: string;
    maxHoursPerDay: number;
    maxHoursPerMonth: number;
    maxHoursPerYear: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateOTConfigDto extends Omit<OTConfig, "id" | "createdAt" | "updatedAt"> { }
export interface UpdateOTConfigDto extends Partial<CreateOTConfigDto> { }

export interface PaidPersonalLeaveEvent {
    id: string;
    code: PaidPersonalEventCode;
    name: string;
    allowedDays: number;
    resetOnUse: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePaidPersonalEventDto extends Omit<PaidPersonalLeaveEvent, "id" | "createdAt" | "updatedAt"> { }
export interface UpdatePaidPersonalEventDto extends Partial<CreatePaidPersonalEventDto> { }
