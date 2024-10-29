import { onCreated, onUpdated } from "./utils/event";

export * from "./storage";
export * from "./users";
export * from "./courses";

// instances timestamp
export const onCreatedInstance = onCreated("instances");
export const onUpdatedInstance = onUpdated("instances");

// teachers timestamp
export const onCreatedTeacher = onCreated("teachers");
export const onUpdatedTeacher = onUpdated("teachers");
