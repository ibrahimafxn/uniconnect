import { toObjectId } from './object-id';

describe('toObjectId', () => {
  it('returns undefined for empty', () => {
    expect(toObjectId(undefined)).toBeUndefined();
  });

  it('returns ObjectId for value', () => {
    const id = toObjectId('507f1f77bcf86cd799439011');
    expect(id?.toString()).toBe('507f1f77bcf86cd799439011');
  });
});
