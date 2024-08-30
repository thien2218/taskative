import { BadRequestException } from "@nestjs/common";

export const DatabaseService = jest.fn().mockReturnValue({
   builder: {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),

      from: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),

      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      prepare: jest.fn().mockReturnThis(),

      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      rightJoin: jest.fn().mockReturnThis(),
      fullJoin: jest.fn().mockReturnThis(),

      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),

      transaction: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({}),
      execute: jest.fn().mockResolvedValue({}),
      run: jest.fn().mockResolvedValue({}),
      all: jest.fn().mockResolvedValue({})
   },

   handleDbError: jest.fn().mockImplementation((error: any) => {
      throw new BadRequestException(error);
   })
});
