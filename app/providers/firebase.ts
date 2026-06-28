import type { ProviderGetImage } from "@nuxt/image";

export const getImage: ProviderGetImage = (url) => {
	if (url.startsWith("/firebase/")) {
		url = `/api/media/images/${url.substring(10)}`;

		return { url };
	}

	return { url };
};
