# Goal: Deprecating Mina Attestations

DynamicArray is now a member of o1js. We should be able to deprecate the use of it from the Mina Attestations library and use it directly.
DynamicArray is an important primitive Nori uses in order to be able to verify merkle tree path witnesses and ensure that roots calculated
match. The reason for the re-implementation compared to using MerkleSet within o1js is that we needed to generate the merkle root in rust
and only verify the witness in o1js, it appeared easier to test by creating uniform implementations which could be co-compared on each side
directly rather than porting all of the Merkle logic to rust. Aka it was simpler to re-implement the dedicated feature than to re-implement
the ensemble of functionality.

We wish to remove MinaAttestations as the functionality is best served by `o1js` core library and to remove `mina-attestations` from our up coming audits scope.

# Background

`merkleLeafAttestorGenerator()` is the core abstraction with inputs:

- A custom max `treeDepth` which defines how many possible leafs a merkle tree can have.
- A user definable `provableLeafType` data structure (the particular Struct `TLeaf` - a generic, for which it member fields can be turned into a single hash - for a particular leaf via some dedicated function)
- A `leafContentsHasher` a function which takes a `TLeaf`'s fields converts them to Bytes and then creates a set of Fields from them (while being careful to not overload the Field prime modulo) and finally takes this set of Fields and parses them through `Poseidon.hash` to yield a single Field representing the leafs contents.

The generator returns:

- `MerkleTreeLeafAttestorInput` - A Struct type which includes a `rootHash`, `path` (witness), `index` and `value`, which allows one to define where a `value` can be found (its index in the list of merkle leaves), to use its witness to provable demonstraight the values inclusion within a `rootHash`.
- `MerkleTreeLeafAttestor` - A ZKProgram which can be used to prove a Leafs inclusion in a root.
- `MerkleTreeLeafAttestorProof` - the return type of the ZKProgram
- `buildLeaves` - a function to apply the `leafContentsHasher` over an array of `TLeaf` structs - and thus yield all Merkle leaves.
- `getMerklePathFromLeaves` - a function to generate a witness for the hash of a `TLeaf` at a given `index` within the set of Merkle leaves.

## Changes to remove MinaAttestations

Migration seems trivial in terms of api changes.

1. Swap dependancy

```typescript
// Remove old dependancy:
// import { DynamicArray } from 'mina-attestations';

// Import new depedancy:
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

Both of these version of the `merkleLeafAttestorGenerator` are identical but for the changes listed above.
Moreover both of these folders has an identical spec file `merkleLeafAttestor.spec.ts` but which uses the imports from the differing versions as mentioned above.

## How to test

1. `npm install`
2. `npm run build`

### Run the MinaAttestations version test

**REMEMBER** to clear the o1js cache before running each test!

`npm run test -- npm run test -- src/merkle-attestor-mina-attestation/merkleLeafAttestor.spec.ts`

**RESULT PASSES!**

### Run the MinaAttestations version test

**REMEMBER** to clear the o1js cache before running each test!

`npm run test -- npm run test -- src/merkle-attestor-o1js/merkleLeafAttestor.spec.ts`

**RESULT FAILS!**

```

```