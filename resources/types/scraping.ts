import type { Group } from "./entities";

export interface ScrapedCourse {
	groups: Group[];
	name: string;
	code: string;
	description: string;
}
