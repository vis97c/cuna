import { onCreated, onUpdated } from "./utils/event";

export * from "./storage";
export * from "./users";

// instances timestamp
export const onCreatedInstance = onCreated("instances");
export const onUpdatedInstance = onUpdated("instances");
