import { APIResponse, APIService } from '..';
import { APIAdapter } from './api-adapter';
import { APIModel } from '../models/api-model';

class MockAPI implements APIService {
	public get = jest.fn();
	public post = jest.fn();
	public put = jest.fn();
	public patch = jest.fn();
	public delete = jest.fn();
}

class MockModel extends APIModel {}

describe( 'APIAdapter', () => {
	let mockService: MockAPI;
	let apiAdapter: APIAdapter;

	beforeEach( () => {
		mockService = new MockAPI();
		apiAdapter = new APIAdapter( mockService );
	} );

	it( 'should create registered models with default creator', async () => {
		mockService.post.mockReturnValueOnce( new APIResponse( 200, {}, { id: 1 } ) );

		apiAdapter.registerModel( MockModel, '/wc/v3/product', ( model ) => model );

		const response = await apiAdapter.create( new MockModel() );

		expect( response ).toBeInstanceOf( MockModel );
		expect( response.id ).toBe( 1 );
	} );

	it( 'should create models with custom creator', async () => {
		apiAdapter.registerModelCallback(
			MockModel,
			( _apiService, model ) => {
				if ( Array.isArray( model ) ) {
					for ( let i = 1; i < 4; ++i ) {
						model[ i - 1 ].onCreated( { id: i } );
					}
				} else {
					model.onCreated( { id: 1 } );
				}

				return Promise.resolve( model );
			},
		);

		const single = await apiAdapter.create( new MockModel() );

		expect( single ).toBeInstanceOf( MockModel );
		expect( single.id ).toBe( 1 );

		const arr = await apiAdapter.create<MockModel>( [ new MockModel(), new MockModel(), new MockModel() ] );

		expect( arr ).toBeInstanceOf( Array );
		expect( arr ).toHaveLength( 3 );
		expect( arr[ 0 ].id ).toBe( 1 );
		expect( arr[ 1 ].id ).toBe( 2 );
		expect( arr[ 2 ].id ).toBe( 3 );
	} );
} );
