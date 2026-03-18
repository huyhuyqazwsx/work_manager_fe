import axiosInstance from "../../../utils/axiosConfig";
import type {
    Holiday,
    CreateHolidayPayload,
    UpdateHolidayPayload,
    CreateHolidayResponse,
    HolidayTotalDays,
    WeekendCountResult,
    LeaveDaysCalculation,
    HolidayDateCheck,
    GenerateRecurringResult,
    HolidayFilterParams,
    CalculateLeaveDaysParams,
} from "../../../types/holiday.types";

const API_BASE = "/holidays";

export const holidayApi = {

    // GET /holidays?year=&month=&type=
    async findAll(params?: HolidayFilterParams): Promise<Holiday[]> {
        const response = await axiosInstance.get(API_BASE, { params });
        return response.data;
    },

    // GET /holidays/:id
    async findById(id: string): Promise<Holiday | null> {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    // GET /holidays/upcoming?limit=
    async findUpcoming(limit?: number): Promise<Holiday[]> {
        const response = await axiosInstance.get(`${API_BASE}/upcoming`, {
            params: limit ? { limit } : undefined,
        });
        return response.data;
    },

    // GET /holidays/year/:year
    async findByYear(year: number): Promise<Holiday[]> {
        const response = await axiosInstance.get(`${API_BASE}/year/${year}`);
        return response.data;
    },

    // GET /holidays/year/:year/total-days
    async getTotalDaysByYear(year: number): Promise<HolidayTotalDays> {
        const response = await axiosInstance.get(`${API_BASE}/year/${year}/total-days`);
        return response.data;
    },

    // GET /holidays/weekends/count?startDate=&endDate=
    async countWeekends(startDate: string, endDate: string): Promise<WeekendCountResult> {
        const response = await axiosInstance.get(`${API_BASE}/weekends/count`, {
            params: { startDate, endDate },
        });
        return response.data;
    },

    // GET /holidays/leave-days/calculate?fromDate=&toDate=&fromSession=&toSession=
    async calculateLeaveDays(params: CalculateLeaveDaysParams): Promise<LeaveDaysCalculation> {
        const response = await axiosInstance.get(`${API_BASE}/leave-days/calculate`, { params });
        return response.data;
    },

    // GET /holidays/check/:date
    async checkDate(date: string): Promise<HolidayDateCheck> {
        const response = await axiosInstance.get(`${API_BASE}/check/${date}`);
        return response.data;
    },

    // GET /holidays/compensatory/list?year=
    async findCompensatory(year?: number): Promise<Holiday[]> {
        const response = await axiosInstance.get(`${API_BASE}/compensatory/list`, {
            params: year ? { year } : undefined,
        });
        return response.data;
    },

    // GET /holidays/compensatory/:originalId
    async findCompensatoryByOriginal(originalId: string): Promise<Holiday | null> {
        const response = await axiosInstance.get(`${API_BASE}/compensatory/${originalId}`);
        return response.data;
    },

    // POST /holidays
    async create(data: CreateHolidayPayload): Promise<CreateHolidayResponse> {
        const response = await axiosInstance.post(API_BASE, data);
        return response.data;
    },

    // PUT /holidays/:id
    async update(id: string, data: UpdateHolidayPayload): Promise<{ message: string }> {
        const response = await axiosInstance.put(`${API_BASE}/${id}`, data);
        return response.data;
    },

    // DELETE /holidays/:id
    async delete(id: string): Promise<{ message: string }> {
        const response = await axiosInstance.delete(`${API_BASE}/${id}`);
        return response.data;
    },

    // POST /holidays/generate-recurring/:year
    async generateRecurring(year: number): Promise<GenerateRecurringResult> {
        const response = await axiosInstance.post(`${API_BASE}/generate-recurring/${year}`);
        return response.data;
    },
};
