import { ePossibleVariantType } from "~/functions/src/types/entities";
import type {
	ProductVariant,
	Product,
	User,
	Category,
	PossibleVariant,
} from "~/resources/types/entities";

export function useImagePath(
	path?: string,
	preset: "avatar" | "small" | "medium" | "large" = "avatar"
) {
	if (!path) return "/sample.png";

	return `/api/media/images/${path}/${preset}.webp`;
}

export function useMapUser({ role = 3, ...user }: User) {
	let roleName = "Invitado";

	role = role ?? 3;

	if (role < 0) roleName = "Desarrollador";
	else if (role < 1) roleName = "Administrador";
	else if (role < 2) roleName = "Editor";
	else if (role < 3) roleName = "Moderador";

	return { ...user, role: roleName };
}
