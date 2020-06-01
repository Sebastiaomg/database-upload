import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

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
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid.');
    }
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();
      if (total < value) {
        throw new AppError('You do not have enough balance');
      }
    }
    const categoriesRepository = getRepository(Category);
    let transactionCategory = await categoriesRepository.findOne({
      where: { title: category },
    });
    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(transactionCategory);
    }
    const createTransaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });
    const transaction = await transactionsRepository.save(createTransaction);
    return transaction;
  }
}

export default CreateTransactionService;
