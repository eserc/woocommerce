import { APIError, APIService } from '..';
import { APIModel } from '../models/api-model';

/**
 * A callback for transforming models into an API request.
 *
 * @callback APITransformerFn
 * @param {APIModel} model The model that we want to transform.
 * @return {*} The structured request data for the API.
 */
export type APITransformerFn<T extends APIModel> = ( model: T ) => any;

/**
 * A class used for creating data models using a supplied API endpoint.
 */
export class APIModelCreator<T extends APIModel> {
	private readonly endpoint: string;
	private readonly transformer: APITransformerFn<T>;

	public constructor( endpoint: string, transformer: APITransformerFn<T> ) {
		this.endpoint = endpoint;
		this.transformer = transformer;
	}

	/**
	 * Creates a model or array of models using the API service.
	 *
	 * @param {APIService}          apiService The API service to create the models using.
	 * @param {APIModel|APIModel[]} model The model or array of models to create.
	 * @return {Promise} Resolves to the created input model or array of models.
	 */
	public create( apiService: APIService, model: T ): Promise<T>;
	public create( apiService: APIService, model: T[] ): Promise<T[]>;
	public create( apiService: APIService, model: T | T[] ): Promise<T> | Promise<T[]> {
		if ( Array.isArray( model ) ) {
			return this.createList( apiService, model );
		}

		return this.createSingle( apiService, model );
	}

	/**
	 * Creates a single model using the API service.
	 *
	 * @param {APIService} apiService The API service to create the model using.
	 * @param {APIModel}   model The model to create.
	 * @return {Promise} Resolves to the created input model.
	 */
	private async createSingle( apiService: APIService, model: T ): Promise<T> {
		return new Promise<T>( async ( resolve ) => {
			const response = await apiService.post<any>(
				this.endpoint,
				this.transformer( model ),
			);
			if ( response instanceof APIError ) {
				throw response;
			}

			model.onCreated( response.data );
			resolve( model );
		} );
	}

	/**
	 * Creates an array of models using the API service.
	 *
	 * @param {APIService} apiService The API service to create the models using.
	 * @param {APIModel[]} models The array of models to create.
	 * @return {Promise} Resolves to the array of created input models.
	 */
	private async createList( apiService: APIService, models: T[] ): Promise<T[]> {
		const promises: Promise<T>[] = [];
		for ( const model of models ) {
			promises.push( this.createSingle( apiService, model ) );
		}

		return Promise.all( promises );
	}
}
