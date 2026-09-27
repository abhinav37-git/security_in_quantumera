package crypto

import (
	"errors"

	"github.com/cloudflare/circl/sign"
	"github.com/cloudflare/circl/sign/mldsa/mldsa44"
	"github.com/cloudflare/circl/sign/mldsa/mldsa65"
	"github.com/cloudflare/circl/sign/mldsa/mldsa87"
)

type MLDSALevel int

const (
	MLDSA44 MLDSALevel = 44
	MLDSA65 MLDSALevel = 65
	MLDSA87 MLDSALevel = 87
)

type MLDSAKeyPair struct {
	Level      MLDSALevel
	PublicKey  []byte
	PrivateKey []byte
}

func getMLDSAScheme(level MLDSALevel) (sign.Scheme, error) {
	switch level {
	case MLDSA44:
		return mldsa44.Scheme(), nil
	case MLDSA65:
		return mldsa65.Scheme(), nil
	case MLDSA87:
		return mldsa87.Scheme(), nil
	default:
		return nil, errors.New("invalid ML-DSA security level")
	}
}

// GenerateMLDSAKeyPair generates a new ML-DSA key pair for the specified security level.
func GenerateMLDSAKeyPair(level MLDSALevel) (*MLDSAKeyPair, error) {
	scheme, err := getMLDSAScheme(level)
	if err != nil {
		return nil, err
	}

	pk, sk, err := scheme.GenerateKey()
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

	return &MLDSAKeyPair{
		Level:      level,
		PublicKey:  pkBytes,
		PrivateKey: skBytes,
	}, nil
}

// SignMLDSA signs a message with the private key using ML-DSA.
// ctx is the context string (up to 255 bytes), which can be empty/nil.
func SignMLDSA(level MLDSALevel, privateKeyBytes []byte, msg []byte, ctx []byte) ([]byte, error) {
	scheme, err := getMLDSAScheme(level)
	if err != nil {
		return nil, err
	}

	sk, err := scheme.UnmarshalBinaryPrivateKey(privateKeyBytes)
	if err != nil {
		return nil, err
	}

	var opts *sign.SignatureOpts
	if len(ctx) > 0 {
		opts = &sign.SignatureOpts{Context: string(ctx)}
	}

	sig := scheme.Sign(sk, msg, opts)
	return sig, nil
}

// VerifyMLDSA verifies an ML-DSA signature.
func VerifyMLDSA(level MLDSALevel, publicKeyBytes []byte, msg []byte, signature []byte, ctx []byte) (bool, error) {
	scheme, err := getMLDSAScheme(level)
	if err != nil {
		return false, err
	}

	pk, err := scheme.UnmarshalBinaryPublicKey(publicKeyBytes)
	if err != nil {
		return false, err
	}

	var opts *sign.SignatureOpts
	if len(ctx) > 0 {
		opts = &sign.SignatureOpts{Context: string(ctx)}
	}

	return scheme.Verify(pk, msg, signature, opts), nil
}
