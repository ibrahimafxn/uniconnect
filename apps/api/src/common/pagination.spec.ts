import { parsePagination } from './pagination';

describe('parsePagination', () => {
  it('defaults to page 1 limit 20', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('clamps invalid values', () => {
    expect(parsePagination({ page: '-1', limit: '500' })).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
  });
});
