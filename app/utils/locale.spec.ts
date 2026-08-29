// @vitest-environment node
import { describe, it, expect } from "vitest";

import { locale } from "./locale";

describe("locale utils", () => {
	it("should contain expected translation mappings", () => {
		expect(locale.course).toBe("Curso");
		expect(locale.description).toBe("Descripción");
		expect(locale.refresh).toBe("Actualizar");
		expect(locale.table_update).toBe("Editar");
	});

	it("should override or merge common translations", () => {
		expect(locale.created_at).toBe("Creado");
		expect(locale.updated_at).toBe("Actualizado");
	});
});
