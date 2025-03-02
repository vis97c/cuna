import { onCreated, onUpdated } from "./utils/event";

export * from "./storage";
export * from "./users";
export * from "./courses";
export * from "./teachers";

// logs timestamp
export const onCreatedLog = onCreated("logs");
export const onUpdatedLog = onUpdated("logs");

// instances timestamp
export const onCreatedInstance = onCreated("instances");
export const onUpdatedInstance = onUpdated("instances");
