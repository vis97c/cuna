import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import { type SharedDocument } from "./entities";

export type Resolve<T extends SharedDocument> = [T, (v?: boolean | iNodeFnResponse) => void];
