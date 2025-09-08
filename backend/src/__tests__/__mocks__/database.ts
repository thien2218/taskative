import { vi } from "vitest";

export const mockDb = {
  selectFrom: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  execute: vi.fn(),
  executeTakeFirst: vi.fn(),
  insertInto: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  updateTable: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  onConflict: vi.fn().mockReturnThis(),
  doNothing: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  transaction: vi.fn().mockReturnValue({
    execute: vi.fn().mockImplementation(async (callback) => {
      const trx = {
        updateTable: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn(),
      };
      await callback(trx);
    }),
  }),
};

export const mockDbService = vi.fn().mockReturnValue({
  db: mockDb,
});
