package crypto

import (
	"errors"

	"github.com/cloudflare/circl/kem"
	"github.com/cloudflare/circl/kem/mlkem/mlkem1024"
	"github.com/cloudflare/circl/kem/mlkem/mlkem512"
	"github.com/cloudflare/circl/kem/mlkem/mlkem768"
)

type MLKEMLevel int

const (
	MLKEM512  MLKEMLevel = 512
	MLKEM768  MLKEMLevel = 768
	MLKEM1024 MLKEMLevel = 1024
)

// MLKEMKeyPair represents an ML-KEM key pair.
type MLKEMKeyPair struct {
	Level      MLKEMLevel
	PublicKey  []byte
	PrivateKey []byte
}

func getMLKEMScheme(level MLKEMLevel) (kem.Scheme, error) {
	switch level {
	case MLKEM512:
		return mlkem512.Scheme(), nil
	case MLKEM768:
		return mlkem768.Scheme(), nil
	case MLKEM1024:
		return mlkem1024.Scheme(), nil
	default:
		return nil, errors.New("invalid ML-KEM security level")
	}
}

// GenerateMLKEMKeyPair generates a new ML-KEM key pair for the specified security level.
func GenerateMLKEMKeyPair(level MLKEMLevel) (*MLKEMKeyPair, error) {
	scheme, err := getMLKEMScheme(level)
	if err != nil {
		return nil, err
	}

	pk, sk, err := scheme.GenerateKeyPair()
	if err != nil {
		return nil, err
	}

	pkBytes, err := pk.MarshalBinary()
	if err != nil {
		return nil, err
	}

	skBytes, err := sk.MarshalBinary()
	if err != nil {
		return nil, err
	}

	return &MLKEMKeyPair{
		Level:      level,
		PublicKey:  pkBytes,
		PrivateKey: skBytes,
	}, nil
}

// EncapsulateMLKEM encapsulates a shared secret using the provided public key.
// Returns the ciphertext and the shared secret.
func EncapsulateMLKEM(level MLKEMLevel, publicKeyBytes []byte) (ct []byte, ss []byte, err error) {
	scheme, err := getMLKEMScheme(level)
	if err != nil {
		return nil, nil, err
	}

	pk, err := scheme.UnmarshalBinaryPublicKey(publicKeyBytes)
	if err != nil {
		return nil, nil, err
	}

	return scheme.Encapsulate(pk)
}

// DecapsulateMLKEM decapsulates a ciphertext using the private key.
// Returns the shared secret.
func DecapsulateMLKEM(level MLKEMLevel, privateKeyBytes []byte, ciphertext []byte) (ss []byte, err error) {
	scheme, err := getMLKEMScheme(level)
	if err != nil {
		return nil, err
	}

	sk, err := scheme.UnmarshalBinaryPrivateKey(privateKeyBytes)
	if err != nil {
		return nil, err
	}

	return scheme.Decapsulate(sk, ciphertext)
}
