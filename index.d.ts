/**
 * The Connex interface.
 */
declare interface Connex {
    /**
     *  the {@link Thor} instance 
     */
    readonly thor: Connex.Thor

    /**
     * the {@link Vendor} instance
     */
    readonly vendor: Connex.Vendor
}

declare namespace Connex {
    /**
     * The main interface to access VeChain.
     */
    interface Thor {
        /**
         * The genesis block of connected network. It's consistent in Connex' life-cycle. 
         */
        readonly genesis: Thor.Block

        /**
         * Returns current block-chain status. 
         */
        readonly status: Thor.Status

        /**
         * Create a ticker to track block-chain steps.
         * 
         * @returns ticker object
         */
        ticker(): Thor.Ticker

        /**
         * Create an account visitor.
         * 
         * @param addr account address
         * @param options 
         */
        account(addr: string, options?: { revision?: string | number }): Thor.AccountVisitor

        /**
         * Create a block visitor.
         * 
         * @param revision block id or number
         */
        block(revision: string | number): Thor.BlockVisitor

        /**
         * Create a transaction visitor.
         * 
         * @param id tx id
         * @param options 
         */
        transaction(id: string, options?: { head?: string }): Thor.TransactionVisitor

        /**
         * Create a filter to filter logs (event | transfer).
         * 
         * @type T
         * @param kind 
         * @param criteriaSet 
         */
        filter<T extends 'event' | 'transfer'>(kind: T, criteriaSet: Array<Thor.Filter.Criteria<T>>): Thor.Filter<T>

        /**
         * To obtain how blockchain would execute a tx with these clauses.
         * 
         * @param clauses clauses to be atomically executed 
         * @param options
         */
        explain(clauses: Thor.Clause[], options?: Thor.CallOptions): Promise<Thor.VMOutput[]>
    }

    namespace Thor {
        interface Ticker {
            /**
             * @returns a promise resolves right after new block added
             * @remarks The returned promise never rejects.
             */
            next(): Promise<void>
        }

        interface AccountVisitor {
            /**
             * the address of account to be visited
             */
            readonly address: string

            /**
             * query the account
             * 
             * @returns promise of account
             */
            get(): Promise<Account>

            /**
             * query account code
             * 
             * @returns promise of account code
             */
            getCode(): Promise<Code>

            /**
             * query account storage
             * 
             * @param key storage key
             * @returns promise of account storage
             */
            getStorage(key: string): Promise<Storage>

            /**
             * Create a method object, to perform contract call, or build transaction clause.
             * 
             * @param abi method's JSON ABI object
             * @returns method object
             */
            method(abi: object): Method

            /**
             * Create an event visitor
             * @param abi event's JSON ABI object
             * @returns event visitor
             */
            event(abi: object): EventVisitor
        }

        interface Method {
            /**
             * Pack arguments into {@link Clause}.
             * @param args method arguments
             * @param value amount of VET to transfer
             */
            asClause(args: any[], value: string | number): Clause

            /**
             * Call the method to obtain output without altering contract state.
             * @param args method arguments
             * @param value amount of VET to transfer
             * @param options 
             */
            call(args: any[], value: string | number, options?: CallOptions): Promise<VMOutput>
        }

        interface EventVisitor {
            /**
             * Pack indexed arguments into {@link Event.Criteria}.
             * @param indexed object contains indexed arguments
             */
            asCriteria(indexed: object): Event.Criteria

            /**
             * Create an event filter
             * @param indexedSet a set of objects contain indexed arguments
             */
            filter(indexedSet: object[]): Filter<'event'>
        }

        interface BlockVisitor {
            /**
             * id or number of the block to be visited
             */
            readonly revision: string | number

            /**
             * query the block
             * @returns a promise of block.
             */
            get(): Promise<Block | null>
        }

        interface TransactionVisitor {
            /**
             * id of transaction to be visited
             */
            readonly id: string

            /**
             * query the transaction
             */
            get(): Promise<Transaction | null>

            /**
             * query the receipt
             */
            getReceipt(): Promise<Receipt | null>
        }

        interface Filter<T extends 'event' | 'transfer'> {
            /**
             * Set the range to filter in
             * @param range 
             */
            range(range: Filter.Range): this

            /**
             * Set to descending order
             */
            desc(): this

            /**
             * Apply the filter
             * @param offset 
             * @param limit 
             * @returns filtered records
             */
            apply(offset: number, limit: number): Promise<Thor.Filter.Result<T>>
        }

        /**
         * block chain status
         */
        type Status = {
            /** 
             * progress of synchronization. 
             * From 0 to 1, 1 means fully synchronized. 
             */
            progress: number

            /**
             * summary of head block
             */
            head: {
                /**
                 * block id
                 */
                id: string

                /**
                 * block number
                 */
                number: number

                /** 
                 * block timestamp 
                 */
                timestamp: number
            }
        }

        type Account = {
            /**
             * account balance in hex string
             */
            balance: string
            /**
             * account energy in hex string
             */
            energy: string
            /**
             * true indicates contract account
             */
            hasCode: boolean
        }

        type Storage = {
            value: string
        }
        type Code = {
            code: string
        }

        type Block = {
            id: string
            number: number
            size: number
            parentID: string
            timestamp: number
            gasLimit: number
            beneficiary: string
            gasUsed: number
            totalScore: number
            txsRoot: string
            stateRoot: string
            receiptsRoot: string
            signer: string
            transactions: string[]
            isTrunk?: boolean
        }

        type Clause = {
            to: string | null
            value: string | number
            data: string
        }

        namespace Transaction {
            type Meta = {
                blockID: string
                blockNumber: number
                blockTimestamp: number
            }
        }

        type Transaction = {
            id: string
            chainTag: number
            blockRef: string
            expiration: number
            clauses: Clause[]
            gasPriceCoef: number
            gas: number
            origin: string
            nonce: string
            dependsOn: string | null
            size: number
            meta?: Transaction.Meta
        }

        type Receipt = {
            gasUsed: number
            gasPayer: string
            paid: string
            reward: string
            reverted: boolean
            outputs: {
                contractAddress: string | null
                events: Event[]
                transfers: Transfer[]
            }[]
            meta?: Transaction.Meta
        }

        type Event = {
            address: string
            topics: string[]
            data: string
            meta?: LogMeta
            decoded?: object
        }

        namespace Event {
            type Criteria = {
                address?: string
                topic0?: string
                topic1?: string
                topic2?: string
                topic3?: string
                topic4?: string
            }
        }

        type Transfer = {
            sender: string
            recipient: string
            amount: string
            meta?: LogMeta
        }

        namespace Transfer {
            type Criteria = {
                txOrigin?: string
                sender?: string
                recipient?: string
            }
        }

        type LogMeta = {
            blockID: string
            blockNumber: number
            blockTimestamp: number
            txID: string
            txOrigin: string
        }

        namespace Filter {
            type Criteria<T extends 'event' | 'transfer'> =
                T extends 'event' ? Event.Criteria :
                T extends 'transfer' ? Transfer.Criteria : never

            type Range = {
                unit: 'block' | 'time'
                from: number
                to: number
            }
            type Result<T extends 'event' | 'transfer'> = Array<
                T extends 'event' ? Event :
                T extends 'transfer' ? Transfer : never>
        }


        type CallOptions = {
            gas?: number
            gasPrice?: string
            caller?: string
            revision?: string | number
        }

        type VMOutput = {
            data: string
            vmError: string
            gasUsed: number
            reverted: boolean
            events: Event[]
            transfers: Transfer[]
            decoded?: object
        }
    }

    interface Vendor {
        /**
         *  Acquire the signing service
         * @param kind kind of target to be signed
         */
        sign<T extends 'tx' | 'cert'>(kind: T): Vendor.SigningService<T>
    }

    namespace Vendor {
        interface SigningService<T extends 'tx' | 'cert'> {
            /**
             * Set message
             * @param msg message requested to be signed
             * @returns this instance
             */

            message(msg: SigningService.Message<T>): this
            /**
             * Send request
             * @param options options of signing request
             * @returns signing result
             */
            request(options?: SigningService.Options<T>): SigningService.Result<T>
        }

        namespace SigningService {
            type TxMessage = {
                clauses: {
                    to: string | null
                    value: string | number
                    data: string
                    /**
                     * comment to the clause
                     */
                    comment?: string
                }[],
                /**
                 * comment to the tx
                 */
                comment?: string
            }


            type CertMessage = {
                purpose: 'identification' | 'agreement'
                payload: {
                    type: 'text'
                    content: string
                }
            }

            type Message<T extends 'tx' | 'cert'> =
                T extends 'tx' ? TxMessage :
                T extends 'cert' ? CertMessage : never

            type TxOptions = {
                signer?: string
                gas?: number
                link?: string
            }

            type CertOptions = {
                signer?: string
            }

            type Options<T extends 'tx' | 'cert'> =
                T extends 'tx' ? TxOptions :
                T extends 'cert' ? CertOptions : never

            type TxResult = {
                txId: string
                signer: string
            }
            type CertResult = {
                annex: {
                    domain: string
                    timestamp: number
                    signer: string
                }
                signature: string
            }
            type Result<T extends 'tx' | 'cert'> =
                T extends 'tx' ? TxResult :
                T extends 'cert' ? CertResult : never

            type ErrorType = 'Rejected'
        }
    }
}


declare interface Window {
    readonly connex: Connex
}

declare const connex: Connex