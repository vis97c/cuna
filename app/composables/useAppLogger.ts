import type { tLogger } from "@open-xamu-co/ui-common-types";

import { makeLogger } from "~/utils/logger";

export default async function useAppLogger(...args: Parameters<tLogger>) {
	const INSTANCE = useInstanceStore();
	const SESSION = useSessionStore();
	const logger = makeLogger({ instanceId: INSTANCE.path, uid: SESSION.member?.uid });

	return logger(...args);
}
