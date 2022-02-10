import assert from 'assert';
import nock from 'nock';
import {getMissingCommits} from '../../scripts/get-missing-cherry-picks-utils';

const url = 'https://api.github.com';
describe('cases where cherry-picks are missing', () => {
  before(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  it('stable has 2 cherry-picks that are not in beta-opt-in', async () => {
    const cherryPickCommits = [
      {
        commit: {
          message: `\
          First PR to fix bug (#29041)
          
          * update worker-dom
          * yarn lock
          
          (cherry picked from commit 725595ac41082b0f9db3103143b04070b0fa7a9e)`,
        },
      },
      {
        commit: {
          message: `\
            Second PR to fix bug (#29051)
            
            (cherry picked from commit b0fd442d5abc691a3d6eea076eccb83525258b7b)`,
        },
      },
    ];

    nock(url)
      .get('/repos/ampproject/amphtml/compare/2202070001000...2202070001002')
      .reply(200, {commits: cherryPickCommits})
      .get(
        '/repos/ampproject/amphtml/compare/2202090001000...725595ac41082b0f9db3103143b04070b0fa7a9e'
      )
      .reply(200, {status: 'diverged'})
      .get(
        '/repos/ampproject/amphtml/compare/2202090001000...b0fd442d5abc691a3d6eea076eccb83525258b7b'
      )
      .reply(200, {status: 'ahead'});

    const releases = new Set([
      '2202060001000', // lts
      '2202070001002', // stable
      '2202080001000', // beta-traffic
    ]);
    const commits = await getMissingCommits('2202090001000', releases);
    assert(commits.length == 2);
    assert(
      [
        '725595ac41082b0f9db3103143b04070b0fa7a9e',
        'b0fd442d5abc691a3d6eea076eccb83525258b7b',
      ].every((c) => commits.includes(c))
    );
    assert(nock.isDone());
  });

  it('stable and lts have the same cherry-pick that is not in beta-opt-in', async () => {
    const cherryPickCommits = [
      {
        commit: {
          message: `\
          First PR to fix bug (#29041)
          
          * update worker-dom
          * yarn lock
          
          (cherry picked from commit 725595ac41082b0f9db3103143b04070b0fa7a9e)`,
        },
      },
    ];
    nock(url)
      .get('/repos/ampproject/amphtml/compare/2202060001000...2202060001001')
      .reply(200, {commits: cherryPickCommits})
      .get('/repos/ampproject/amphtml/compare/2202070001000...2202070001001')
      .reply(200, {commits: cherryPickCommits})
      .get(
        '/repos/ampproject/amphtml/compare/2202090001000...725595ac41082b0f9db3103143b04070b0fa7a9e'
      )
      .reply(200, {status: 'diverged'});
    const releases = new Set([
      '2202060001001', // lts
      '2202070001001', // stable
      '2202080001000', // beta-traffic
    ]);
    const commits = await getMissingCommits('2202090001000', releases);
    assert(commits.length == 1);
    assert(commits[0] == '725595ac41082b0f9db3103143b04070b0fa7a9e');
    assert(nock.isDone());
  });
});

describe('cases where cherry-picks are not missing', () => {
  before(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  it('beta-traffic has a cherry-pick that was included in beta-opt-in cut', async () => {
    const cherryPickCommits = [
      {
        commit: {
          message: `\
          First PR to fix bug (#29041)
          
          * update worker-dom
          * yarn lock
          
          (cherry picked from commit 725595ac41082b0f9db3103143b04070b0fa7a9e)`,
        },
      },
    ];
    nock(url)
      .get('/repos/ampproject/amphtml/compare/2202080001000...2202080001001')
      .reply(200, {commits: cherryPickCommits})
      .get(
        '/repos/ampproject/amphtml/compare/2202090001000...725595ac41082b0f9db3103143b04070b0fa7a9e'
      )
      .reply(200, {status: 'behind'});

    const releases = new Set([
      '2202060001000', // lts
      '2202070001000', // stable
      '2202080001001', // beta-traffic
    ]);
    const commits = await getMissingCommits('2202090001000', releases);
    assert(commits.length == 0);
    assert(nock.isDone());
  });

  it('none of the channels have cherry-picks', async () => {
    const releases = new Set([
      '2202060001000', // lts
      '2202070001000', // stable
      '2202080001000', // beta-traffic
    ]);
    const commits = await getMissingCommits('2202090001000', releases);
    assert(commits.length == 0);
    assert(nock.isDone());
  });
});
