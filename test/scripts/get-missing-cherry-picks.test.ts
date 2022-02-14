import assert from 'assert';
import {Octokit, RestEndpointMethodTypes} from '@octokit/rest';
import {spy, when, deepEqual, resetCalls, reset} from 'ts-mockito';
import {getMissingCommits} from '../../scripts/get-missing-cherry-picks-utils';

describe('get missing cherry-picks tests', () => {
  type CompareResponse =
    RestEndpointMethodTypes['repos']['compareCommitsWithBasehead']['response'];
  const octokit = {
    rest: {
      repos: {
        compareCommitsWithBasehead: () => null,
      },
    },
  } as unknown as Octokit;
  const spiedRepos = spy(octokit.rest.repos);

  afterEach(() => {
    resetCalls(spiedRepos);
  });

  after(() => {
    reset(spiedRepos);
  });

  describe('cases where cherry-picks are missing', () => {
    it('stable has 2 cherry-picks that are not in beta-opt-in', async () => {
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead: '2202070001000...2202070001002',
          })
        )
      ).thenResolve({
        status: 200,
        data: {
          commits: [
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
          ],
        },
      } as CompareResponse);
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead:
              '2202090001000...725595ac41082b0f9db3103143b04070b0fa7a9e',
          })
        )
      ).thenResolve({
        status: 200,
        data: {status: 'diverged'},
      } as CompareResponse);
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead:
              '2202090001000...b0fd442d5abc691a3d6eea076eccb83525258b7b',
          })
        )
      ).thenResolve({
        status: 200,
        data: {status: 'ahead'},
      } as CompareResponse);

      const releases = new Set([
        '2202060001000', // lts
        '2202070001002', // stable
        '2202080001000', // beta-traffic
      ]);
      const commits = await getMissingCommits(
        octokit,
        '2202090001000',
        releases
      );
      assert(commits.length == 2);
      assert(commits.includes('725595ac41082b0f9db3103143b04070b0fa7a9e'));
      assert(commits.includes('b0fd442d5abc691a3d6eea076eccb83525258b7b'));
    });

    it('stable and lts have the same cherry-pick that is not in beta-opt-in', async () => {
      const compareReleasesResponse = {
        status: 200,
        data: {
          commits: [
            {
              commit: {
                message: `\
              First PR to fix bug (#29041)
              
              * update worker-dom
              * yarn lock
              
              (cherry picked from commit 725595ac41082b0f9db3103143b04070b0fa7a9e)`,
              },
            },
          ],
        },
      } as CompareResponse;
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead: '2202060001000...2202060001001',
          })
        )
      ).thenResolve(compareReleasesResponse);
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead: '2202070001000...2202070001001',
          })
        )
      ).thenResolve(compareReleasesResponse);
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead:
              '2202090001000...725595ac41082b0f9db3103143b04070b0fa7a9e',
          })
        )
      ).thenResolve({
        status: 200,
        data: {status: 'diverged'},
      } as CompareResponse);

      const releases = new Set([
        '2202060001001', // lts
        '2202070001001', // stable
        '2202080001000', // beta-traffic
      ]);
      const commits = await getMissingCommits(
        octokit,
        '2202090001000',
        releases
      );
      assert(commits.length == 1);
      assert(commits.includes('725595ac41082b0f9db3103143b04070b0fa7a9e'));
    });
  });

  describe('cases where cherry-picks are not missing', () => {
    it('beta-traffic has a cherry-pick that was included in beta-opt-in cut', async () => {
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead: '2202080001000...2202080001001',
          })
        )
      ).thenResolve({
        status: 200,
        data: {
          commits: [
            {
              commit: {
                message: `\
              First PR to fix bug (#29041)
              
              * update worker-dom
              * yarn lock
              
              (cherry picked from commit 725595ac41082b0f9db3103143b04070b0fa7a9e)`,
              },
            },
          ],
        },
      } as CompareResponse);
      when(
        spiedRepos.compareCommitsWithBasehead(
          deepEqual({
            owner: 'ampproject',
            repo: 'amphtml',
            basehead:
              '2202090001000...725595ac41082b0f9db3103143b04070b0fa7a9e',
          })
        )
      ).thenResolve({
        status: 200,
        data: {status: 'behind'},
      } as CompareResponse);

      const releases = new Set([
        '2202060001000', // lts
        '2202070001000', // stable
        '2202080001001', // beta-traffic
      ]);
      const commits = await getMissingCommits(
        octokit,
        '2202090001000',
        releases
      );
      assert(commits.length == 0);
    });

    it('none of the channels have cherry-picks', async () => {
      const releases = new Set([
        '2202060001000', // lts
        '2202070001000', // stable
        '2202080001000', // beta-traffic
      ]);
      const commits = await getMissingCommits(
        octokit,
        '2202090001000',
        releases
      );
      assert(commits.length == 0);
    });
  });
});
