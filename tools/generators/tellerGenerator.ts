import type { Prisma } from '@prisma/client'
import Chance from 'chance'
import { DateTime } from 'luxon'
import type { TellerTypes } from '../../libs/teller-api/src'

const chance = new Chance()

function generateSubType(
    type: TellerTypes.AccountTypes
): TellerTypes.DepositorySubtypes | TellerTypes.CreditSubtype {
    if (type === 'depository') {
        return chance.pickone([
            'checking',
            'savings',
            'money_market',
            'certificate_of_deposit',
            'treasury',
            'sweep',
        ]) as TellerTypes.DepositorySubtypes
    } else {
        return 'credit_card' as TellerTypes.CreditSubtype
    }
}

type GenerateAccountsParams = {
    count: number
    enrollmentId: string
    institutionName: string
    institutionId: string
    accountType?: TellerTypes.AccountTypes
    accountSubType?: TellerTypes.DepositorySubtypes | TellerTypes.CreditSubtype
}

export function generateAccounts({
    count,
    enrollmentId,
    institutionName,
    institutionId,
    accountType,
    accountSubType,
}: GenerateAccountsParams) {
    const accounts: TellerTypes.Account[] = []
    for (let i = 0; i < count; i++) {
        const accountId = chance.guid()
        const lastFour = chance.string({ length: 4, pool: '0123456789' })
        const type: TellerTypes.AccountTypes =
            accountType ?? chance.pickone(['depository', 'credit'])
        let subType: TellerTypes.DepositorySubtypes | TellerTypes.CreditSubtype
        subType = generateSubType(type)

        const accountStub = {
            enrollment_id: enrollmentId,
            links: {
                balances: `https://api.teller.io/accounts/${accountId}/balances`,
                self: `https://api.teller.io/accounts/${accountId}`,
                transactions: `https://api.teller.io/accounts/${accountId}/transactions`,
            },
            institution: {
                name: institutionName,
                id: institutionId,
            },
            name: chance.word(),
            currency: 'USD',
            id: accountId,
            last_four: lastFour,
            status: chance.pickone(['open', 'closed']) as TellerTypes.AccountStatus,
        }

        if (chance.bool()) {
            accounts.push({
                ...accountStub,
                type: 'depository',
                subtype: chance.pickone([
                    'checking',
                    'savings',
                    'money_market',
                    'certificate_of_deposit',
                    'treasury',
                    'sweep',
                ]),
            })
        } else {
            accounts.push({
                ...accountStub,
                type: 'credit',
                subtype: 'credit_card',
            })
        }
    }
    return accounts
}

export function generateBalance(account_id: string): TellerTypes.AccountBalance {
    const amount = chance.floating({ min: 0, max: 10000, fixed: 2 }).toString()
    return {
        available: amount,
        ledger: amount,
        links: {
            account: `https://api.teller.io/accounts/${account_id}`,
            self: `https://api.teller.io/accounts/${account_id}/balances`,
        },
        account_id,
    }
}

type GenerateAccountsWithBalancesParams = {
    count: number
    enrollmentId: string
    institutionName: string
    institutionId: string
    accountType?: TellerTypes.AccountTypes
    accountSubType?: TellerTypes.DepositorySubtypes | TellerTypes.CreditSubtype
}

export function generateAccountsWithBalances({
    count,
    enrollmentId,
    institutionName,
    institutionId,
    accountType,
    accountSubType,
}: GenerateAccountsWithBalancesParams): TellerTypes.GetAccountsResponse {
    const accountsWithBalances: TellerTypes.AccountWithBalances[] = []
    for (let i = 0; i < count; i++) {
        const account = generateAccounts({
            count,
            enrollmentId,
            institutionName,
            institutionId,
            accountType,
            accountSubType,
        })[0]
        const balance = generateBalance(account.id)
        accountsWithBalances.push({
            ...account,
            balance,
        })
    }
    return accountsWithBalances
}

export function generateTransactions(count: number, accountId: string): TellerTypes.Transaction[] {
    const transactions: TellerTypes.Transaction[] = []

    for (let i = 0; i < count; i++) {
        const transactionId = `txn_${chance.guid()}`
        const transaction = {
            details: {
                processing_status: chance.pickone(['complete', 'pending']),
                category: chance.pickone([
                    'accommodation',
                    'advertising',
                    'bar',
                    'charity',
                    'clothing',
                    'dining',
                    'education',
                    'electronics',
                    'entertainment',
                    'fuel',
                    'general',
                    'groceries',
                    'health',
                    'home',
                    'income',
                    'insurance',
                    'investment',
                    'loan',
                    'office',
                    'phone',
                    'service',
                    'shopping',
                    'software',
                    'sport',
                    'tax',
                    'transport',
                    'transportation',
                    'utilities',
                ]),
                counterparty: {
                    name: chance.company(),
                    type: chance.pickone(['person', 'business']),
                },
            },
            running_balance: null,
            description: chance.sentence({ words: chance.integer({ min: 3, max: 10 }) }),
            id: transactionId,
            date: chance.date({ min: lowerBound.toJSDate(), max: now.toJSDate() }).toISOString(),
            account_id: accountId,
            links: {
                account: `https://api.teller.io/accounts/${accountId}`,
                self: `https://api.teller.io/accounts/${accountId}/transactions/${transactionId}`,
            },
            amount: chance.floating({ min: 0, max: 10000, fixed: 2 }).toString(),
            type: chance.pickone(['transfer', 'deposit', 'withdrawal']),
            status: chance.pickone(['pending', 'posted']),
        } as TellerTypes.Transaction
        transactions.push(transaction)
    }
    return transactions
}

export function generateEnrollment(): TellerTypes.Enrollment & { institutionId: string } {
    const institutionName = chance.company()
    const institutionId = institutionName.toLowerCase().replace(/\s/g, '_')
    return {
        accessToken: `token_${chance.string({ length: 15, pool: 'abcdefghijklmnopqrstuvwxyz' })}`,
        user: {
            id: `usr_${chance.string({ length: 15, pool: 'abcdefghijklmnopqrstuvwxyz' })}`,
        },
        enrollment: {
            id: `enr_${chance.string({ length: 15, pool: 'abcdefghijklmnopqrstuvwxyz' })}`,
            institution: {
                name: institutionName,
            },
        },
        signatures: [chance.string({ length: 15, pool: 'abcdefghijklmnopqrstuvwxyz' })],
        institutionId,
    }
}

type GenerateConnectionsResponse = {
    enrollment: TellerTypes.Enrollment & { institutionId: string }
    accounts: TellerTypes.Account[]
    accountsWithBalances: TellerTypes.AccountWithBalances[]
    transactions: TellerTypes.Transaction[]
}

export function generateConnection(): GenerateConnectionsResponse {
    const accountsWithBalances: TellerTypes.AccountWithBalances[] = []
    const accounts: TellerTypes.Account[] = []
    const transactions: TellerTypes.Transaction[] = []

    const enrollment = generateEnrollment()

    const accountCount: number = chance.integer({ min: 1, max: 3 })

    const enrollmentId = enrollment.enrollment.id
    const institutionName = enrollment.enrollment.institution.name
    const institutionId = enrollment.institutionId
    accountsWithBalances.push(
        ...generateAccountsWithBalances({
            count: accountCount,
            enrollmentId,
            institutionName,
            institutionId,
        })
    )
    for (const account of accountsWithBalances) {
        const { balance, ...accountWithoutBalance } = account
        accounts.push(accountWithoutBalance)
        const transactionsCount: number = chance.integer({ min: 1, max: 5 })
        const generatedTransactions = generateTransactions(transactionsCount, account.id)
        transactions.push(...generatedTransactions)
    }

    return {
        enrollment,
        accounts,
        accountsWithBalances,
        transactions,
    }
}

export const now = DateTime.fromISO('2022-01-03', { zone: 'utc' })

export const lowerBound = DateTime.fromISO('2021-12-01', { zone: 'utc' })

export const testDates = {
    now,
    lowerBound,
    totalDays: now.diff(lowerBound, 'days').days,
    prismaWhereFilter: {
        date: {
            gte: lowerBound.toJSDate(),
            lte: now.toJSDate(),
        },
    } as Prisma.AccountBalanceWhereInput,
}

export function calculateDailyBalances(startingBalance, transactions, dateInterval) {
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const balanceChanges = {}

    transactions.forEach((transaction) => {
        const date = new Date(transaction.date).toISOString().split('T')[0]
        balanceChanges[date] = (balanceChanges[date] || 0) + Number(transaction.amount)
    })
    return dateInterval.map((date) => {
        return Object.keys(balanceChanges)
            .filter((d) => d <= date)
            .reduce((acc, d) => acc + balanceChanges[d], startingBalance)
    })
}
