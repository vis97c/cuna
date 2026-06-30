import { GoogleAuth } from "google-auth-library";

export async function getQueueUrl(name: string) {
	const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
	const projectId = await auth.getProjectId();
	const url = `https://cloudfunctions.googleapis.com/v2beta/projects/${projectId}/locations/us-east1/functions/${name}`;

	const client = await auth.getClient();
	const res = await client.request({ url });
	const uri = (res.data as Record<string, any>)?.serviceConfig?.uri;

	if (!uri) throw new Error(`Unable to retreive uri for function at ${url}`);

	return { projectId, uri };
}
