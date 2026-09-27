package engine

import (
	"hash/fnv"
	"sync"
)

// BloomFilter is a thread-safe, memory-efficient probabilistic set.
type BloomFilter struct {
	mu      sync.RWMutex
	bitset  []uint64
	size    uint64
	numHash uint32
}

// NewBloomFilter creates a bloom filter with a given bit size and hash count.
func NewBloomFilter(size uint64, numHash uint32) *BloomFilter {
	if size == 0 {
		size = 1024 * 1024 // default 1MB bitset
	}
	if numHash == 0 {
		numHash = 4
	}
	words := (size + 63) / 64
	return &BloomFilter{
		bitset:  make([]uint64, words),
		size:    size,
		numHash: numHash,
	}
}

// hashes calculates multiple hash positions using double hashing technique.
func (bf *BloomFilter) hashes(data string) (uint64, uint64) {
	h1 := fnv.New64a()
	h1.Write([]byte(data))
	hash1 := h1.Sum64()

	h2 := fnv.New64()
	h2.Write([]byte(data))
	hash2 := h2.Sum64()
	if hash2 == 0 {
		hash2 = 0x517cc1b727220a95
	}
	return hash1, hash2
}

// Add inserts a string key into the filter.
func (bf *BloomFilter) Add(data string) {
	bf.mu.Lock()
	defer bf.mu.Unlock()

	h1, h2 := bf.hashes(data)
	for i := uint32(0); i < bf.numHash; i++ {
		combined := (h1 + uint64(i)*h2) % bf.size
		wordIdx := combined / 64
		bitIdx := combined % 64
		bf.bitset[wordIdx] |= (1 << bitIdx)
	}
}

// Contains checks whether a key might be in the set (zero false negatives).
func (bf *BloomFilter) Contains(data string) bool {
	bf.mu.RLock()
	defer bf.mu.RUnlock()

	h1, h2 := bf.hashes(data)
	for i := uint32(0); i < bf.numHash; i++ {
		combined := (h1 + uint64(i)*h2) % bf.size
		wordIdx := combined / 64
		bitIdx := combined % 64
		if (bf.bitset[wordIdx] & (1 << bitIdx)) == 0 {
			return false
		}
	}
	return true
}
