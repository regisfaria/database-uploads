import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // check if that category exists
    // exists:
    //  get it's id and store with this transaction
    // dont exists:
    //  create new category and store into this transaction with the returned id
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError(
        'Insuficient balance available for this transaction',
        403,
      );
    }

    const checkCategoryExistence = await categoriesRepository.findOne({
      title: category,
    });

    // No category with that title was found
    if (!checkCategoryExistence) {
      const newCategory = categoriesRepository.create({ title: category });

      await categoriesRepository.save(newCategory);

      const transaction = transactionsRepository.create({
        title,
        type,
        value,
        categoryId: newCategory.id,
      });

      await transactionsRepository.save(transaction);

      return transaction;
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      categoryId: checkCategoryExistence.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
