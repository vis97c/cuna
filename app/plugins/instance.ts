import {
	getRedirectResult,
	GoogleAuthProvider,
	onIdTokenChanged,
	signInWithCredential,
} from "firebase/auth";
import { doc, DocumentReference, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";

import type { Instance, InstanceRef, MemberRef, Member } from "~/utils/types";
import { eMemberRole } from "~~/functions/src/types/entities";

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
		const INSTANCE = useInstanceStore();
		const { cache } = useRuntimeConfig().public;
		const route = useRoute();
		const unattended = "/desatendido";
		let instance: Instance | undefined = INSTANCE.current;

		try {
			// Get fresh instance
			if (!instance?.id && !INSTANCE.fresh) {
				// Inject request headers
				const headers = {
					...useRequestHeaders(), // Get headers from server (required for instance)
					"Cache-Control": cache.frequent,
				};

				// Get current instance, prefer $fetch
				instance = await $fetch<Instance>("/api/instance", {
					credentials: "omit",
					headers,
				});
			}

			// No instance found, launch error, do not log
			if (!instance?.id) throw new Error("Instance not found");

			// Set instance, await for SSR
			await INSTANCE.setInstance(instance);

			// Restore navigation
			if (route?.path === unattended) {
				await navigateTo({ path: "/", query: { rdr: "instance" } }, { redirectCode: 302 });
			} else if (import.meta.client) setupAuth(instance);
		} catch (err) {
			// Instance not found, Go to unnatended
			INSTANCE.unsetInstance();

			// Go to unnatended
			if (route?.path !== unattended) {
				const restricted = encodeURI(route?.fullPath);

				await navigateTo(
					{ path: unattended, query: { restricted, rdr: "instance" } },
					{ redirectCode: 302 }
				);
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
function setupAuth(instance: Instance) {
	const INSTANCE = useInstanceStore();
	const SESSION = useSessionStore();
	const route = useRoute();

	const { $clientFirestore, $clientAuth, $resolveClientRefs } = useNuxtApp();

	/**
	 * Setup session on client
	 * Instance comes from middleware
	 */
	if (!instance?.id || !$clientFirestore || !$clientAuth || !$resolveClientRefs) return;

	let unsubMember: Unsubscribe;

	const logger = makeLogger({ instancePath: instance.id, loggerFirestore: $clientFirestore });
	const instanceRef: DocumentReference<InstanceRef> = doc($clientFirestore, instance.id);

	/**
	 * Setup user on every token refresh
	 * Get fresh token & role before any redirect
	 */
	onIdTokenChanged($clientAuth, async (authUser) => {
		unsubMember?.();

		if (!authUser) {
			// Attempt checking redirect result
			// Setup is required for: https://console.cloud.google.com/auth/clients
			try {
				const result = await getRedirectResult($clientAuth, GoogleAuthProvider);

				if (!result) throw new Error("No redirect result");

				const credential = GoogleAuthProvider.credentialFromResult(result);

				if (!credential) throw new Error("No credentials");

				const { user } = await signInWithCredential($clientAuth, credential);

				authUser = user;
			} catch (err) {
				const middleware = route.meta?.middleware;

				// Clear session
				SESSION.unsetSession();

				// Redirect to login if current route requires auth
				if (Array.isArray(middleware) && middleware.includes("auth-only")) {
					const restricted = encodeURI(route?.fullPath);

					// Rdr with restricted path
					await navigateTo(
						{ path: "/ingresar", query: { restricted, rdr: "auth" } },
						{ redirectCode: 302 }
					);
				}

				return;
			}
		}

		const {
			uid,
			displayName: userName,
			photoURL: userPhotoURL,
			isAnonymous,
			emailVerified,
		} = authUser;
		const memberRef: DocumentReference<MemberRef> = doc(instanceRef, "members", uid);
		// Get fresh token
		const token = await authUser.getIdToken();

		// Set session, flatten member data
		SESSION.setMember(
			{
				uid,
				isAnonymous,
				emailVerified,
				photoURL: userPhotoURL,
				role: eMemberRole.GUEST,
				name: userName || "",
			},
			token
		);

		// Keep member fresh
		unsubMember = onSnapshot(
			memberRef,
			async (memberSnapshot) => {
				const memberData = await $resolveClientRefs(memberSnapshot, { level: 1 }, true);
				const member: Member = {
					...memberData,
					uid,
					isAnonymous,
					// email,
					emailVerified,
					photoURL: memberData?.photoURL ?? userPhotoURL,
					role: memberData?.role ?? eMemberRole.GUEST,
					name: memberData?.name || userName || "",
				};

				// Update session, flatten member data
				SESSION.setMember({ ...member, id: memberRef.path }, token);

				const bannedUntil = member?.bannedUntilAt ? new Date(member.bannedUntilAt) : null;
				const isBanned = bannedUntil ? bannedUntil > new Date() : false;

				if (isBanned) {
					if (route.path !== "/suspendido") {
						await navigateTo(
							{ path: "/suspendido", query: { rdr: "auth" } },
							{ redirectCode: 302 }
						);
					}

					return;
				} else if (route.path === "/suspendido") {
					await navigateTo({ path: "/", query: { rdr: "auth" } }, { redirectCode: 302 });
				} else if (route.path === "/ingresar") {
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
							if (route.path !== rdr) {
								await navigateTo(
									{ path: rdr, query: { rdr: "auth" } },
									{ redirectCode: 302 }
								);
							}
						}
					} else {
						await navigateTo(
							{ path: "/", query: { rdr: "auth" } },
							{ redirectCode: 302 }
						);
					}
				}

				// Bypass sync if user is fresh
				if (
					memberSnapshot.exists() &&
					userPhotoURL === memberData?.photoURL &&
					emailVerified === memberData?.emailVerified
				) {
					return;
				}

				try {
					// Prevent role override
					const { role, ...newMember } = member;

					// Set new member, do not await
					setDoc(memberRef, { ...newMember, createdByRef: memberRef }, { merge: true });
				} catch (err) {
					// Log user/member error
					logger("plugins:firebase:watchUser", "Error setting user/member", err);
				}
			},
			(err) => logger("plugins:firebase:watchUser:snapshot", err)
		);
	});

	let unsubInstance: Unsubscribe;

	/**
	 * Keep instance fresh for power users
	 * Power users can modify instances, keep them fresh
	 */
	watch(
		() => SESSION.canModerate,
		(canModerate) => {
			unsubInstance?.();

			if (!canModerate || !instance?.id || !$clientFirestore || !$resolveClientRefs) {
				return;
			}

			const logger = makeLogger({
				instancePath: instance.id,
				loggerFirestore: $clientFirestore,
			});
			const instanceRef: DocumentReference<InstanceRef, Instance> = doc(
				$clientFirestore,
				instance.id
			);

			// Keep instance fresh
			unsubInstance = onSnapshot(
				instanceRef,
				async (snapshot) => {
					try {
						const freshInstance = await $resolveClientRefs(snapshot, { level: 1 });

						// Set instance, do not await
						INSTANCE.setInstance(freshInstance);
					} catch (err) {
						logger("plugins:firebase:keepInstanceFresh", err);
					}
				},
				(err) => logger("plugins:firebase:keepInstanceFresh:snapshot", err)
			);
		},
		{ immediate: true }
	);
}
