export * from "./enums/index.ts";

export interface CoursesResponse<T> {
	data: T[];
	totalRecords: number;
	totalPages: number;
	currentPage: number;
	/**
	 * Given limit, 10 by default
	 */
	limit: number;
}
