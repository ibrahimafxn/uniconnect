import { Types } from 'mongoose';

export function toObjectId(value?: string) {
  return value ? new Types.ObjectId(value) : undefined;
}
