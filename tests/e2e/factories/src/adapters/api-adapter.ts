import { APIService } from '..';
import { APIModel } from '../models/api-model';
import { APIModelCreator } from './api-model-creator';

/**
 * A callback for creating models using the API.
 *
 * @callback APICreatorFn
 * @param {APIService}          apiService The API service to be used in the creation.
 * @param {APIModel|APIModel[]} model The model or array of models to create using the API.
 * @return {Promise}
 */
export type APICreatorFn<T extends APIModel> = ( apiService: APIService, model: T | T[] ) => Promise<T | T[]>;

/**
 * An adapter for handling the creation of models using the API service.
 */
export class APIAdapter {
	private readonly apiService: APIService;
	private readonly entries: { [ key: string ]: APICreatorFn<any> };

	public constructor( apiService: APIService ) {
		this.apiService = apiService;
		this.entries = {};
	}

	/**
	 * Register a new model with the adapter to be created using the API.
	 *
	 * @param {Function} modelClass The class of the model to handle.
	 * @param {string}   endpoint The API endpoint to POST for creation.
	 * @param {Function} transformer A function to transform the model into API request format.
	 */
	public registerModel<T extends APIModel>(
		modelClass: new () => T,
		endpoint: string,
		transformer: ( model: T ) => any,
	): void {
		if ( this.entries.hasOwnProperty( modelClass.name ) ) {
			throw new Error( 'An adapter has already been registered for this class.' );
		}

		const creator = new APIModelCreator<T>( endpoint, transformer );
		this.entries[ modelClass.name ] = ( apiService, model ) => creator.create( apiService, model );
	}

	/**
	 * Register a new model with a custom handler for the adapter to use when creating using the API.
	 *
	 * @param {Function}     modelClass The class of the model to handle.
	 * @param {APICreatorFn} callback A function to create the model using the API.
	 */
	public registerModelCallback<T extends APIModel>( modelClass: new () => T, callback: APICreatorFn<T> ): void {
		if ( this.entries.hasOwnProperty( modelClass.name ) ) {
			throw new Error( 'An adapter has already been registered for this class.' );
		}

		this.entries[ modelClass.name ] = callback;
	}

	/**
	 * Creates a model or array of models using the API.
	 *
	 * @param {APIModel|APIModel[]} model The model or array of models to create.
	 * @return {Promise} Resolves to the created input model or array of models.
	 */
	public create<T extends APIModel>( model: T ): Promise<T>;
	public create<T extends APIModel>( model: T[] ): Promise<T[]>;
	public create<T extends APIModel>( model: T | T[] ): Promise<T | T[]> {
		let entryKey: string;
		if ( Array.isArray( model ) ) {
			entryKey = model[ 0 ].constructor.name;
		} else {
			entryKey = model.constructor.name;
		}

		if ( ! this.entries.hasOwnProperty( entryKey ) ) {
			throw new Error( 'An adapter has not been defined for this class.' );
		}

		return this.entries[ entryKey ]( this.apiService, model );
	}
}
