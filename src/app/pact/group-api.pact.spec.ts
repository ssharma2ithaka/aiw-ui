/*eslint-disable*/
import { HttpClientModule } from '@angular/common/http';
import { TestBed, getTestBed } from '@angular/core/testing';
import { PactWeb, Matchers } from '@pact-foundation/pact-web';
import { GroupService, AuthService, GroupList, ImageGroup } from '../shared';

describe('Group Calls #pact', () => {

    let provider;
    let _groupService;

    const expectedPrivateGroupList: GroupList = {
      'success': true,
      'total': 3,
      'groups': [
        {'tags': [], 'sequence_number': 0, 'update_date': '2017-12-06T13:50:41Z', 'name': 'All PC Assets', 'description': '', 'public': false, 'creation_date': '2017-12-06T13:49:57Z', 'id': 'ba35d77a-7b98-49ee-8102-25c7e4a35ae5', 'access': [], 'items': ['SS36904_36904_35824231'], 'group_type': 200, 'owner_id': '706217', 'owner_name': 'air01@artstor.org'},
        {'tags': ['PC Test', 'MLK'], 'sequence_number': 0, 'update_date': '2017-08-07T16:03:09Z', 'name': 'PC test', 'description': '', 'public': false, 'creation_date': '2017-01-09T23:45:40Z', 'id': '900590', 'access': [], 'items': ['CARNEGIE_700001', 'MOMA_620002', 'MOMA_600006'], 'group_type': 200, 'owner_id': '706217', 'owner_name': 'air01@artstor.org'},
        {'tags': [], 'sequence_number': 0, 'update_date': '2017-07-07T17:00:40Z', 'name': 'Some Assets', 'description': '', 'public': false, 'creation_date': '2017-07-07T17:00:40Z', 'id': 'a1fc32cc-8859-49f7-a560-5da0c5928500', 'access': [], 'items': ['AAFOLKAIG_10313142481', 'AAFOLKAIG_10313142791', 'AAFOLKAIG_10313143138', 'AAGOIG_10314000081'], 'group_type': 200, 'owner_id': '706217', 'owner_name': 'air01@artstor.org'},
      ],
      'tags': [{'key': 'MLK', 'doc_count': 1}, {'key': 'PC Test', 'doc_count': 1}]
    }

    // Image Group with id of 44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb
    const expectedImageGroupObject: ImageGroup = {
      'description': '',
      'owner_name': 'air01@artstor.org',
      'tags': ['adl', 'collection'],
      'owner_id': '706217',
      'sequence_number': 0,
      'update_date': '2018-01-16T18:49:07Z',
      'name': 'ADL_Group1_copy',
      'public': false,
      'creation_date': '2018-01-16T18:48:43Z',
      'id': '44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb',
      'access': [
        {
          'entity_type': 100,
          'entity_identifier': '706217',
          'access_type': 300
        }
      ],
      'items': [
        {'artstorid': 'ASITESPHOTOIG_10312738558', zoom: { viewerX: 100, viewerY: 500, pointWidth: 600, pointHeight: 800 }},
        {'artstorid': 'AWAYNEIG_10311326670'},
        {'artstorid': 'ADAVISIG_10311277805'},
        {'artstorid': 'AWSS35953_35953_38398951'},
        {'artstorid': 'HARTILL_12324316'},
        {'artstorid': 'AWSS35953_35953_38398953'},
        {'artstorid': 'HCAP_10310729952'},
        {'artstorid': 'HCAP_10310728522'},
        {'artstorid': 'ASITESPHOTOIG_10313835802'}
      ]
    }

    // Verify types of response properties - Private Group List
    let matcherPrivateGroupListObject = {}
    Object.keys(expectedPrivateGroupList).forEach( (key) => {
      matcherPrivateGroupListObject[key] = Matchers.somethingLike(expectedPrivateGroupList[key])
    })

    // Verify types of response properties - Individual Image Group
    let matcherImageGroupObject = {}
    Object.keys(expectedImageGroupObject).forEach((key) => {
      if (key === 'items'){
        if (Array.isArray(expectedImageGroupObject[key]) && expectedImageGroupObject[key][0]){
          let itemsArray = Matchers.eachLike(expectedImageGroupObject[key][0])
          matcherImageGroupObject[key] = Matchers.somethingLike(itemsArray)
        }
      } else{
        matcherImageGroupObject[key] = Matchers.somethingLike(expectedImageGroupObject[key])
      }
    })

    beforeAll(function(done) {
      provider = new PactWeb({ consumer: 'aiw-ui', provider: 'binder-group', port: 1201 })
      // Required for slower environments
      setTimeout(function () { done() }, 2000)
      // Required if run with `singleRun: false` (see karma config)
      provider.removeInteractions()
    })

    afterAll(function (done) {
      provider.finalize()
        .then(function () { done() }, function (err) { done.fail(err) })
    })

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          GroupService
        ],
        imports: [
          HttpClientModule
        ]
      });

      _groupService = getTestBed().get(GroupService)
    });

    /**
     * Mock and test group listing endpoint
     */
    describe('getAllPrivateGroups', () => {
      beforeAll((done) =>  {
        provider.addInteraction({
          state: 'I am logged in as qapact@artstor.org',
          uponReceiving: 'a request for all private groups',
          withRequest: {
            method: 'GET',
            path: '/api/v1/group',
            query: 'size=48&level=private&from=0&sort=alpha&order=asc'
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: matcherPrivateGroupListObject
          }
        })
        .then(() => { done() }, (err) => { done.fail(err) })
      })

      afterEach((done) => {
        provider.verify()
        .then(function(a) {
          done()
        }, function(e) {
          done.fail(e)
        })
      })

      it('should return a list of private group objects', function(done) {
        // Run the tests
        _groupService.getAll('private', 48, 0, [], '', '', 'alpha', 'asc')
          .subscribe(res => {
            // Test if the response object has all the keys / properties
            let actualResKeys = Object.keys(res).sort();
            let expectedResKeys = [ 'success', 'total', 'tags', 'groups'].sort()
            expect(actualResKeys).toEqual(expectedResKeys)

            // Test success to be true
            expect(res.success).toBeTruthy()

            // Test total to be numeric
            expect(res.total).toEqual(jasmine.any(Number))

            // Test tags array object keys
            let actualTagKeys = Object.keys(res.tags[0]).sort()
            let expectedTagKeys = [ 'key', 'doc_count'].sort()
            expect(actualTagKeys).toEqual(expectedTagKeys)

            // Test groups array object keys
            let actualGroupKeys = Object.keys(res.groups[0]).sort()
            let expectedGroupKeys = [ 'access', 'creation_date', 'description', 'group_type', 'id', 'items', 'name', 'owner_id', 'owner_name', 'public', 'sequence_number', 'tags', 'update_date'].sort()
            expect(actualGroupKeys).toEqual(expectedGroupKeys)

            done()
          },
          err => {

          done.fail(err)
        })
      });
    })

    /**
     * Mock and test a group/id enpoint (a single group)
     */
    describe('GET /api/v1/group/{id}', () => {
      beforeAll((done) => {

        provider.addInteraction({
          uponReceiving: 'a request for an individual image group',
          withRequest: {
            method: 'GET',
            path: '/api/v1/group/44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb',
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: matcherImageGroupObject
          }
        })
          .then(() => { done() }, (err) => { done.fail(err) })
      })

      afterEach((done) => {
        provider.verify()
          .then(function (a) {
            done()
          }, function (e) {
            done.fail(e)
          })
      })

      it('should return an image group object',
        function (done) {

          _groupService.get('44d14fe7-13ec-4d84-b911-7ee3ffc4b0cb')
            .subscribe(res => {

              let actualResKeys = Object.keys(res) // response object keys
              let resAccessKeys = Object.keys(res.access[0]) // response 'access' object keys

              let expectedResKeys = [
                'description',
                'owner_name',
                'tags',
                'owner_id',
                'sequence_number',
                'update_date',
                'name',
                'public',
                'creation_date',
                'id',
                'access',
                'items'
              ]

              let expectedAccessKeys = [
                'entity_type',
                'entity_identifier',
                'access_type'
              ]

              // Test res.keys match expected keys
              expect(actualResKeys).toEqual(expectedResKeys)

              // Test res.access.keys
              expect(resAccessKeys).toEqual(expectedAccessKeys)

              // Test res.items length
              expect(res.items.length).toBeGreaterThan(0)
              done()
            },
              err => {
                done.fail(err)
              }
          )
        })
    })

})
