export * from "./enums";
export * from "./explorerV1";

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
