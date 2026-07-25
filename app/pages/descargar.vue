<template>
	<div id="download" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center --gap-30">
				<!-- Header -->
				<div class="txt --txtAlign-center --gap-5">
					<h1 class="--txtLineHeight-sm">
						<XamuActionLink to="/descargar" class="no--override no--route --gap">
							<span>cuna</span>
							<XamuIconFa name="chess-knight" :size="10" />
						</XamuActionLink>
						<span class="--txtSize-md --txtColor-primary --mLeft-5">Desktop</span>
					</h1>
					<div class="flx --flxRow --flx-center --gap-10">
						<p>Visor de cursos UNAL</p>
						<XamuActionLink
							class="x-info"
							:theme="eColors.DARK"
							tooltip="Cuna no esta afiliada a la UNAL"
							tooltip-as-text
						>
							<XamuIconFa name="circle-info" />
						</XamuActionLink>
					</div>
					<div class="flx --flxRow --flx-center --gap-10 --txtSize-xs --txtColor-dark5">
						<XamuActionLink
							href="https://github.com/vis97c/cuna"
							tooltip="Código fuente. GNU GPL v3"
						>
							<XamuIconFa name="github" brand />
						</XamuActionLink>
						<span v-if="INSTANCE.config?.version">
							{{ INSTANCE.config.version }} Powered by
							<a href="https://xamu.com.co" target="_blank" rel="noopener noreferrer">
								Xamu.
							</a>
						</span>
					</div>
				</div>

				<div class="txt --txtAlign-center --txtSize-xs --maxWidth-none --gap-10">
					<h6 class="--txtSize-sm">
						Descarga la aplicación de escritorio y consulta cursos sin restricciones.
					</h6>
					<p class="--txtColor-dark5">
						Ejecuta el scraper directamente en tu computador. Mayor velocidad, uso de
						cuenta opcional y libre de bloqueos de servidores o proxies.
					</p>
				</div>
				<!-- Downloads Section -->
				<div
					class="flx --flxColumn --flx-center --gap-20 --width-100 --maxWidth-770 --pY-20:md"
				>
					<div class="txt --txtAlign-center">
						<h3>Elige tu sistema operativo</h3>
					</div>
					<div
						class="grd --grdColumns-single --grdColumns-auto3:md --gap --gap-20:md --width-100"
					>
						<!-- Windows -->
						<XamuBaseBox class="flx --flxColumn --flx-start-stretch --p" button>
							<div class="txt --txtAlign">
								<div>
									<h4 class="flx --flxRow --flx-start-center --gap-5">
										<XamuIconFa name="windows" brand :size="24" />
										<span>Windows</span>
									</h4>
									<span class="--txtSize-xs --opacity-05">x64 (.exe)</span>
								</div>
								<p class="--txtSize-xs">
									Compatible con Windows 10 y 11. Ejecutable portátil sin
									instalación.
								</p>
							</div>
							<div class="flx --flxColumn --flx-end-start --gap-5 --flx">
								<XamuActionLink
									class="--txtSize-sm"
									href="https://github.com/vis97c/cuna/releases/latest/download/cuna-desktop-windows-x64.exe"
								>
									<XamuIconFa name="download" :size="15" />
									<span>Descargar para Windows</span>
								</XamuActionLink>
							</div>
						</XamuBaseBox>
						<!-- Linux -->
						<XamuBaseBox class="flx --flxColumn --flx-start-stretch --p" button>
							<div class="txt --txtAlign">
								<div>
									<h4 class="flx --flxRow --flx-start-center --gap-5">
										<XamuIconFa name="linux" brand :size="24" />
										<span>Linux</span>
									</h4>
									<span class="--txtSize-xs --opacity-05">x64 (Binario)</span>
								</div>
								<p class="--txtSize-xs">
									Compatible con distribuciones Linux x86_64 (Ubuntu, Fedora,
									Debian).
								</p>
							</div>
							<div class="flx --flxColumn --flx-end-start --gap-5 --flx">
								<XamuActionLink
									class="--txtSize-sm"
									href="https://github.com/vis97c/cuna/releases/latest/download/cuna-desktop-linux-x64"
								>
									<XamuIconFa name="download" :size="15" />
									<span>Descargar para Linux</span>
								</XamuActionLink>
							</div>
						</XamuBaseBox>
						<!-- macOS -->
						<XamuBaseBox class="flx --flxColumn --flx-start-stretch --p" button>
							<div class="txt --txtAlign">
								<div>
									<h4 class="flx --flxRow --flx-start-center --gap-5">
										<XamuIconFa name="apple" brand :size="24" />
										<span>macOS</span>
									</h4>
									<span class="--txtSize-xs --opacity-05">
										Apple Silicon / Intel
									</span>
								</div>
								<p class="--txtSize-xs">
									Soporta arquitecturas Apple Silicon (M1/M2/M3/M4) e Intel.
								</p>
							</div>
							<div class="flx --flxColumn --flx-end-start --gap-5 --flx">
								<XamuActionLink
									class="--txtSize-sm"
									href="https://github.com/vis97c/cuna/releases/latest/download/cuna-desktop-macos-arm64"
								>
									<XamuIconFa name="download" :size="15" />
									<span>Apple Silicon (ARM64)</span>
								</XamuActionLink>
								<XamuActionLink
									class="--txtSize-sm"
									href="https://github.com/vis97c/cuna/releases/latest/download/cuna-desktop-macos-x64"
								>
									<XamuIconFa name="download" :size="15" />
									<span>macOS Intel (x64)</span>
								</XamuActionLink>
							</div>
						</XamuBaseBox>
					</div>
				</div>
				<!-- Advantages Grid -->
				<div
					class="grd --grdColumns-single --grdColumns-auto3:md --gap --gap-20:md --width-100 --maxWidth-770 --txtSize-xs"
				>
					<div class="txt --txtAlign-center --maxWidth-none --gap-5">
						<h6 class="--txtSize-sm">Ultra rápido</h6>
						<p class="--txtColor-dark5">
							Consulta el SIA directamente en tu equipo usando tu propio navegador
							local sin intermediarios.
						</p>
					</div>
					<div class="txt --txtAlign-center --maxWidth-none --gap-5">
						<h6 class="--txtSize-sm">Sin necesidad de cuenta</h6>
						<p class="--txtColor-dark5">
							Puedes realizar búsquedas y obtener información de cursos sin necesidad
							de iniciar sesión.
						</p>
					</div>
					<div class="txt --txtAlign-center --maxWidth-none --gap-5">
						<h6 class="--txtSize-sm">100% Privado</h6>
						<p class="--txtColor-dark5">
							Tu información privada no sale de tu equipo, mientras obtienes
							información del SIA.
						</p>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Download page
	 *
	 * @page
	 */
	definePageMeta({
		title: "Descargar Cuna Desktop",
		description:
			"Descarga la aplicación de escritorio Cuna y consulta cursos del SIA sin restricciones.",
	});

	const INSTANCE = useInstanceStore();
</script>
