import {
	getRedirectResult,
	GoogleAuthProvider,
	onIdTokenChanged,
	signInWithCredential,
} from "firebase/auth";
import {
	deleteField,
	doc,
	DocumentReference,
	getDoc,
	onSnapshot,
	setDoc,
	type Unsubscribe,
} from "firebase/firestore";

import { makeLogger } from "@open-xamu-co/firebase-nuxt/client/logger";

import type { RootRef } from "@open-xamu-co/firebase-nuxt/client";
import type {
	ExtendedInstance,
	ExtendedInstanceMemberRef,
	ExtendedUserRef,
	ExtendedUser,
	ExtendedInstanceRef,
} from "~/utils/types";
import { eCacheControl } from "@open-xamu-co/firebase-nuxt/functions/enums";
import { safeInstanceConfig } from "~/utils/firestore";

/**
 * Setup instance
 *
 * 1. Provide instance
 * 2. Setup session on client, handle fresh auth redirects
 *
 * @plugin
 */
export default defineNuxtPlugin({
	name: "instance",
	dependsOn: ["pinia", "firebase-setup"],
	async setup() {
		const ROOT = useRootStore();
		const INSTANCE = useInstanceStore();
		const route = useRoute();
		const { rootInstanceId } = useRuntimeConfig().public;
		const unattended = "/desatendido";
		let instance: ExtendedInstance | undefined = INSTANCE.current;

		try {
			// Get fresh instance
			if (!instance?.id && !INSTANCE.fresh) {
				// Inject request headers
				const headers = {
					...useRequestHeaders(), // Get headers from server (required for instance)
					"Cache-Control": eCacheControl.FREQUENT,
				};

				// Get current instance, prefer $fetch
				instance = await $fetch<ExtendedInstance>("/api/instance", { headers });
			}

			// No instance found, launch error, do not log
			if (!instance?.id) throw new Error("Instance not found");
			else if (instance?.id === `ìnstances/${rootInstanceId}`) ROOT.setRoot(instance); // Same as root

			// Set instance, await for SSR
			await INSTANCE.setInstance(instance);

			// Restore navigation
			if (route?.path === unattended) navigateTo("/", { redirectCode: 302 });
			else if (import.meta.client) setupAuth(instance);
		} catch (err) {
			// Instance not found, Go to unnatended
			INSTANCE.unsetInstance();

			// Go to unnatended
			if (route?.path !== unattended) {
				const query = { restricted: encodeURI(route?.fullPath) };

				navigateTo({ path: unattended, query }, { redirectCode: 302 });
			}
		}
	},
});

/**
 * Setup auth
 *
 * 1. Setup session on client
 * 2. Get fresh instance for power users
 */
function setupAuth(instance: ExtendedInstance) {
	const ROOT = useRootStore();
	const INSTANCE = useInstanceStore();
	const USER = useUserStore();
	const { rootInstanceId } = useRuntimeConfig().public;
	const route = useRoute();

	const {
		$clientFirestore: firestore,
		$clientAuth: auth,
		$resolveClientRefs: resolveRefs,
	} = useNuxtApp();

	/**
	 * Setup session on client
	 * Instance comes from middleware
	 */
	if (!instance?.id || !firestore || !auth || !resolveRefs) return;

	let unsubUser: Unsubscribe;

	const logger = makeLogger({ instanceId: instance.id, loggerFirestore: firestore });
	const instanceRef: DocumentReference<ExtendedInstanceRef> = doc(firestore, instance.id);

	/**
	 * Setup user on every token refresh
	 * Get fresh token & role before any redirect
	 */
	onIdTokenChanged(auth, async (authUser) => {
		unsubUser?.();

		if (!authUser) {
			// Attempt checking redirect result
			// Setup is required for: https://console.cloud.google.com/auth/clients
			try {
				const result = await getRedirectResult(auth, GoogleAuthProvider);

				if (!result) throw new Error("No redirect result");

				const credential = GoogleAuthProvider.credentialFromResult(result);

				if (!credential) throw new Error("No credentials");

				const { user } = await signInWithCredential(auth, credential);

				authUser = user;
			} catch (err) {
				const middleware = route.meta?.middleware;

				// Clear session
				USER.unsetSession();

				// Redirect to login if current route requires auth
				if (Array.isArray(middleware) && middleware.includes("auth-only")) {
					const restricted = encodeURI(route?.fullPath);

					// Rdr with restricted path
					navigateTo({ path: "/ingresar", query: { restricted } }, { redirectCode: 302 });
				}

				return;
			}
		}

		const { uid, displayName: name, email, photoURL, isAnonymous } = authUser;
		const userRef: DocumentReference<ExtendedUserRef> = doc(firestore, "users", uid);
		const rootInstanceRef: DocumentReference<RootRef> = doc(
			firestore,
			"instances",
			rootInstanceId
		);
		const memberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			instanceRef,
			"members",
			uid
		);
		const rootMemberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			rootInstanceRef,
			"members",
			uid
		);

		// Get fresh token & member data
		const token = await authUser.getIdToken();
		const memberSnapshot = await getDoc(memberRef);
		// Member role required before any redirect
		const memberData = memberSnapshot.data() || {};
		let user: ExtendedUser = { name, isAnonymous, uid, email, photoURL, id: memberRef.path };

		// Set session, flatten member data
		USER.setUser({ ...user, role: memberData.role ?? 3 }, token);

		// Keep user fresh
		unsubUser = onSnapshot(
			userRef,
			async (userSnapshot) => {
				const userData = await resolveRefs(userSnapshot);
				const rootMemberSnapshot = await getDoc(rootMemberRef);
				const rootMemberData = rootMemberSnapshot.data() || {};
				// Smaller number means higher access role
				const role = Math.min(rootMemberData?.role ?? 3, memberData?.role ?? 3);

				user = { ...userData, uid, email, photoURL, id: memberRef.path };

				// Sync firestore user & member.
				if (!memberSnapshot.exists() || user.email !== email || role !== memberData?.role) {
					try {
						// Set new user, do not await
						setDoc(userRef, user, { merge: true });
						// Set new member, do not await
						setDoc(
							memberRef,
							{
								userRef,
								// Unset if not root member
								rootMemberRef: rootMemberSnapshot.exists()
									? rootMemberRef
									: deleteField(),
								role,
							},
							{ merge: true }
						);
					} catch (err) {
						// Log user/member error
						logger("plugins:firebase:watchUser", "Error setting user/member", err);
					}
				}

				// Update session, flatten member data
				USER.setUser({ ...user, role }, token);
			},
			(err) => logger("plugins:firebase:watchUser:snapshot", err)
		);

		// Handle auth rdr
		const { restricted } = route.query;
		const rdr = typeof restricted === "string" && decodeURI(restricted);

		if (rdr) {
			try {
				// Prevent open redirect
				const url = new URL(rdr);

				// Someone is trying to redirect to a different domain
				logger?.("plugins:firebase:authRdr", "Open redirect detected", url);
			} catch (err) {
				// This is the expected behavior
				// Redirect if rdr is relative path
				if (route.path !== rdr) navigateTo(rdr, { redirectCode: 302 });
			}
		} else if (route.path === "/ingresar") navigateTo("/", { redirectCode: 302 });
	});

	let unsubInstance: Unsubscribe;
	let unsubRoot: Unsubscribe;

	/**
	 * Keep instance fresh for power users
	 * Power users can modify instances, keep them fresh
	 */
	watch(
		() => USER.canModerate,
		(canModerate) => {
			unsubInstance?.();
			unsubRoot?.();

			if (!canModerate || !instance?.id || !firestore || !resolveRefs) return;

			const logger = makeLogger({
				instanceId: instance.id,
				loggerFirestore: firestore,
			});
			const instanceRef: DocumentReference<ExtendedInstanceRef, ExtendedInstance> = doc(
				firestore,
				instance.id
			);
			const rootInstanceRef: DocumentReference<RootRef> = doc(
				firestore,
				"instances",
				rootInstanceId
			);

			// Keep root fresh if not current instance
			if (instance.id !== `ìnstances/${rootInstanceId}`) {
				unsubRoot = onSnapshot(
					rootInstanceRef,
					async (snapshot) => {
						try {
							const freshRoot = await resolveRefs(snapshot, { level: 1 });

							ROOT.setRoot({
								...freshRoot,
								config: safeInstanceConfig(freshRoot?.config),
							});
						} catch (err) {
							logger("plugins:firebase:keepRootFresh", err);
						}
					},
					(err) => logger("plugins:firebase:keepRootFresh:snapshot", err)
				);
			}

			// Keep instance fresh
			unsubInstance = onSnapshot(
				instanceRef,
				async (snapshot) => {
					try {
						const freshInstance = await resolveRefs(snapshot, { level: 1 });

						const fixedInstance: ExtendedInstance = {
							...freshInstance,
							config: safeInstanceConfig(freshInstance?.config),
						};

						// Also set root if current instance is root
						if (instance?.id === `ìnstances/${rootInstanceId}`) {
							ROOT.setRoot(fixedInstance);
						}

						// Set instance, do not await
						INSTANCE.setInstance(fixedInstance);
					} catch (error) {
						logger("plugins:firebase:keepInstanceFresh", error);
					}
				},
				(err) => logger("plugins:firebase:keepInstanceFresh:snapshot", err)
			);
		},
		{ immediate: true }
	);
}
