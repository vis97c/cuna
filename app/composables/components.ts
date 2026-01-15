import type { FunctionalComponent } from "vue";

/**
 * Role component
 */
export const useRoleComponent: FunctionalComponent<{ value: number }> = ({ value }) => {
	return h("span", useRoleName(value));
};
