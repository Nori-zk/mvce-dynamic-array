# Goal: Deprecating Mina Attestations

DynamicArray is now a member of o1js. We should be able to deprecate the use of it from the Mina Attestations library and use it directly.
DynamicArray is an important primitive Nori uses to verify Merkle tree path witnesses and ensure that calculated roots
match. The reason for the re-implementation compared to using MerkleSet within o1js is that we needed to generate the Merkle root in Rust
and only verify the witness in o1js. It appeared easier to test by creating uniform implementations which could be co-compared on each side
directly rather than porting all of the Merkle logic to Rust. In short, it was simpler to re-implement the dedicated feature than to re-implement
the ensemble of functionality.

We wish to remove MinaAttestations as the functionality is best served by the `o1js` core library and to remove `mina-attestations` from our upcoming audit scope.

# Background

`merkleLeafAttestorGenerator()` is the core abstraction with inputs:

- A custom max `treeDepth` which defines the depth of the Merkle tree (i.e., up to 2^treeDepth leaves).
- A user-definable `provableLeafType` data structure (the particular Struct `TLeaf` - a generic, for which its member fields can be turned into a single hash - for a particular leaf via some dedicated function)
- A `leafContentsHasher`, a function which takes a `TLeaf`'s fields, converts them to Bytes, and then creates a set of Fields from them (while being careful not to overload the Field prime modulo) and finally takes this set of Fields and passes them through `Poseidon.hash` to yield a single Field representing the leaf's contents.

The generator returns:

- `MerkleTreeLeafAttestorInput` - A Struct type which includes a `rootHash`, `path` (witness), `index` and `value`, which allows one to define where a `value` can be found (its index in the list of Merkle leaves), to use its witness to provably demonstrate the value's inclusion within a `rootHash`.
- `MerkleTreeLeafAttestor` - A ZKProgram which can be used to prove a leaf's inclusion in a root.
- `MerkleTreeLeafAttestorProof` - the return type of the ZKProgram
- `buildLeaves` - a function to apply the `leafContentsHasher` over an array of `TLeaf` structs - and thus yield all Merkle leaves.
- `getMerklePathFromLeaves` - a function to generate a witness for the hash of a `TLeaf` at a given `index` within the set of Merkle leaves.

## Changes to remove MinaAttestations

Migration seems trivial in terms of API changes.

1. Swap dependency

```typescript
// Remove old dependency:
// import { DynamicArray } from 'mina-attestations';

// Import new dependency:
import { DynamicArray } from 'o1js';
```

2. Change type generation

```typescript
// Change argument from 'maxLength'
// const MerklePath = DynamicArray(Field, { maxLength: treeDepth });

// To 'capacity'
const MerklePath = DynamicArray(Field, { capacity: treeDepth });
```

3. Change `bitPath` calculation argument

```typescript
// Change 'path.maxLength'
// const bitPath = index.value.toBits(path.maxLength);

// To 'path.capacity'
const bitPath = index.value.toBits(path.capacity);
```

## Test environment

In this repository two folders have been prepared:

1. [The original MinaAttestations version](./src/merkle-attestor-mina-attestation/merkleLeafAttestor.ts) of our `merkleLeafAttestor` which uses the `DynamicArray` primitive from `MinaAttestations`.
2. [The o1js version](./src/merkle-attestor-o1js/merkleLeafAttestor.ts) of our `merkleLeafAttestor`  which uses `o1js`.

Both of these versions of the `merkleLeafAttestorGenerator` are identical but for the [changes listed above](#changes-to-remove-minaattestations).
Moreover both of these folders have an identical spec file `merkleLeafAttestor.spec.ts` which use the imports from their respective versions.

## How to test

1. `npm install`
2. `npm run build`

### Run the **MinaAttestations** version test

**REMEMBER** to clear the o1js cache before running each test!

`npm run test -- src/merkle-attestor-mina-attestation/merkleLeafAttestor.spec.ts`

**RESULT PASSES!**

### Run the **o1js** version test

**REMEMBER** to clear the o1js cache before running each test!

`npm run test -- src/merkle-attestor-o1js/merkleLeafAttestor.spec.ts`

**RESULT FAILS!**

The failure occurs during the ZKProgram compilation stage (`MerkleTreeLeafAttestor.compile()`), not during proof generation. The `assert_equal: 0 != 1` error indicates a constraint mismatch when the circuit is being compiled.

I suspect this line may be the cause:

`const bitPath = index.value.toBits(path.capacity);`

```
 FAIL  src/merkle-attestor-o1js/merkleLeafAttestor.spec.ts (8.527 s)
  Merkle Attestor Test
    ✓ compute_non_provable_storage_slot_leaf_hash (8 ms)
    ✕ test_all_leaf_counts_and_indices_with_pipeline (6052 ms)
    ✕ huge_2pow16_leaves_provable_test (1646 ms)

  ● Merkle Attestor Test › test_all_leaf_counts_and_indices_with_pipeline

    assert_equal: 0 != 1

      at node_modules/o1js/src/lib/proof-system/zkprogram.ts:795:30
      at withThreadPool (o1js/src/lib/proof-system/workers.ts:60:16)
      at prettifyStacktracePromise (o1js/src/lib/util/errors.ts:129:12)
      at compileProgram (o1js/src/lib/proof-system/zkprogram.ts:779:51)
      at Object.compile (o1js/src/lib/proof-system/zkprogram.ts:397:50)
      at Object.<anonymous> (o1js/merkleLeafAttestor.spec.ts:98:37)

  ● Merkle Attestor Test › huge_2pow16_leaves_provable_test

    assert_equal: 0 != 1

      at node_modules/o1js/src/lib/proof-system/zkprogram.ts:795:30
      at withThreadPool (o1js/src/lib/proof-system/workers.ts:60:16)
      at prettifyStacktracePromise (o1js/src/lib/util/errors.ts:129:12)
      at compileProgram (o1js/src/lib/proof-system/zkprogram.ts:779:51)
      at Object.compile (o1js/src/lib/proof-system/zkprogram.ts:397:50)
      at Object.<anonymous> (o1js/merkleLeafAttestor.spec.ts:194:37)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 1 passed, 3 total
Snapshots:   0 total
```

