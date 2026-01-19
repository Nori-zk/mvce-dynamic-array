import {
    Bytes,
    Field,
    Provable,
    ProvableType,
    Struct,
    UInt64,
    UInt8,
} from 'o1js';
import { Tuple } from 'o1js/dist/node/lib/util/types.js';
import {
    PrivateInput,
    ZkProgram as ZkProgramFunc,
} from 'o1js/dist/node/lib/proof-system/zkprogram.js';

export type Constructor<T = any> = new (...args: any) => T;

export type ZkProgram<
    Config extends {
        publicInput?: ProvableType;
        publicOutput?: ProvableType;
        methods: {
            [I in string]: {
                privateInputs: Tuple<PrivateInput>;
                auxiliaryOutput?: ProvableType;
            };
        };
    }
> = ReturnType<typeof ZkProgramFunc<Config>>;

export type CompilableZkProgram = {
    compile: (options?: any) => Promise<{
        verificationKey: {
            data: string;
            hash: Field;
        };
    }>;
};

export class Bytes32 extends Bytes(32) {
    static get zero() {
        return new this(new Array(32).map(() => new UInt8(0)));
    }
}

export class Bytes20 extends Bytes(20) {
    static get zero() {
        return new this(new Array(20).map(() => new UInt8(0)));
    }
}