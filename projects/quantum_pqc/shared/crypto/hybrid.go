package crypto

import (
	"crypto/ecdh"
	"crypto/rand"
	"errors"
)

// HybridKeyPair contains public and private keys for the hybrid scheme.
type HybridKeyPair struct {
	PublicKey  []byte // X25519 pk (32 bytes) + ML-KEM-768 pk (1184 bytes)
	PrivateKey []byte // X25519 sk (32 bytes) + ML-KEM-768 sk (2400 bytes)
}

// GenerateHybridKeyPair generates a new hybrid X25519 + ML-KEM-768 key pair.
func GenerateHybridKeyPair() (*HybridKeyPair, error) {
	// 1. Generate X25519 key pair
	x25519Priv, err := ecdh.X25519().GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	x25519Pub := x25519Priv.PublicKey().Bytes()
	x25519PrivBytes := x25519Priv.Bytes()

	// 2. Generate ML-KEM-768 key pair
	mlkemPair, err := GenerateMLKEMKeyPair(MLKEM768)
	if err != nil {
		return nil, err
	}

	// 3. Concatenate keys
	pubKey := make([]byte, len(x25519Pub)+len(mlkemPair.PublicKey))
	copy(pubKey[0:32], x25519Pub)
	copy(pubKey[32:], mlkemPair.PublicKey)

	privKey := make([]byte, len(x25519PrivBytes)+len(mlkemPair.PrivateKey))
	copy(privKey[0:32], x25519PrivBytes)
	copy(privKey[32:], mlkemPair.PrivateKey)

	return &HybridKeyPair{
		PublicKey:  pubKey,
		PrivateKey: privKey,
	}, nil
}

// EncapsulateHybrid encapsulates a shared secret for a hybrid X25519 + ML-KEM-768 public key.
// Returns the hybrid ciphertext and combined 32-byte shared secret.
func EncapsulateHybrid(hybridPubKey []byte) (ct []byte, ss []byte, err error) {
	if len(hybridPubKey) != 32+1184 {
		return nil, nil, errors.New("invalid hybrid public key length")
	}

	x25519PubBytes := hybridPubKey[0:32]
	mlkemPubBytes := hybridPubKey[32:]

	// 1. Generate ephemeral X25519 key pair for ECDH
	x25519EphemPriv, err := ecdh.X25519().GenerateKey(rand.Reader)
	if err != nil {
		return nil, nil, err
	}
	x25519EphemPub := x25519EphemPriv.PublicKey().Bytes()

	// 2. Perform X25519 ECDH
	peerX25519Pub, err := ecdh.X25519().NewPublicKey(x25519PubBytes)
	if err != nil {
		return nil, nil, err
	}
	x25519SS, err := x25519EphemPriv.ECDH(peerX25519Pub)
	if err != nil {
		return nil, nil, err
	}

	// 3. Encapsulate ML-KEM-768
	mlkemCT, mlkemSS, err := EncapsulateMLKEM(MLKEM768, mlkemPubBytes)
	if err != nil {
		return nil, nil, err
	}

	// 4. Combine shared secrets by XORing them
	if len(x25519SS) != 32 || len(mlkemSS) != 32 {
		return nil, nil, errors.New("unexpected shared secret lengths")
	}
	combinedSS := make([]byte, 32)
	for i := 0; i < 32; i++ {
		combinedSS[i] = x25519SS[i] ^ mlkemSS[i]
	}

	// 5. Combine ciphertexts: X25519 ephemeral public key (32 bytes) + ML-KEM ciphertext (1088 bytes)
	combinedCT := make([]byte, len(x25519EphemPub)+len(mlkemCT))
	copy(combinedCT[0:32], x25519EphemPub)
	copy(combinedCT[32:], mlkemCT)

	return combinedCT, combinedSS, nil
}

// DecapsulateHybrid decapsulates a hybrid ciphertext using the hybrid private key.
// Returns the combined 32-byte shared secret.
func DecapsulateHybrid(hybridPrivKey []byte, hybridCiphertext []byte) (ss []byte, err error) {
	if len(hybridPrivKey) != 32+2400 {
		return nil, errors.New("invalid hybrid private key length")
	}
	if len(hybridCiphertext) != 32+1088 {
		return nil, errors.New("invalid hybrid ciphertext length")
	}

	x25519PrivBytes := hybridPrivKey[0:32]
	mlkemPrivBytes := hybridPrivKey[32:]

	x25519EphemPubBytes := hybridCiphertext[0:32]
	mlkemCTBytes := hybridCiphertext[32:]

	// 1. Perform X25519 ECDH using server private key and ephemeral client public key
	x25519Priv, err := ecdh.X25519().NewPrivateKey(x25519PrivBytes)
	if err != nil {
		return nil, err
	}
	peerX25519EphemPub, err := ecdh.X25519().NewPublicKey(x25519EphemPubBytes)
	if err != nil {
		return nil, err
	}
	x25519SS, err := x25519Priv.ECDH(peerX25519EphemPub)
	if err != nil {
		return nil, err
	}

	// 2. Decapsulate ML-KEM-768
	mlkemSS, err := DecapsulateMLKEM(MLKEM768, mlkemPrivBytes, mlkemCTBytes)
	if err != nil {
		return nil, err
	}

	// 3. Combine shared secrets by XORing them
	if len(x25519SS) != 32 || len(mlkemSS) != 32 {
		return nil, errors.New("unexpected shared secret lengths")
	}
	combinedSS := make([]byte, 32)
	for i := 0; i < 32; i++ {
		combinedSS[i] = x25519SS[i] ^ mlkemSS[i]
	}

	return combinedSS, nil
}
