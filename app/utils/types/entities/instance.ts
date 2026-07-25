import type { InstanceData, InstanceDataConfig } from "~~/functions/src/types/entities/index.ts";

import type { InputFromData, OutputFromData, RefFromData } from "./base.ts";

/** @output App instance data */
export interface Instance extends OutputFromData<InstanceData> {}
/** @output App instance with client refs */
export interface InstanceRef extends RefFromData<InstanceData> {}
/** @input Omit automation */
export interface InstanceInput extends InputFromData<InstanceData> {}

/** @output Instance config data */
export interface InstanceConfig extends OutputFromData<InstanceDataConfig> {}
/** @output Instance config with client refs */
export interface InstanceConfigRef extends RefFromData<InstanceDataConfig> {}
/** @input Omit automation */
export interface InstanceConfigInput extends InputFromData<InstanceDataConfig> {}
