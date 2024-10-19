export type SearchConfig = {
	provider: "algolia";
	options: DocSearchOptions;
};
export interface DocSearchOptions {
	appId: string;
	apiKey: string;
	indexName: string;
}
