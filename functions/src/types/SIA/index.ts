export * from "./enums/index.js";

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
