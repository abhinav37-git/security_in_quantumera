package crypto

import (
	"errors"

	"github.com/trailofbits/lms-go/lms/common"
	"github.com/trailofbits/lms-go/lms/lms"
)

// GenerateLMSKeyPair generates a new stateful LMS key pair.
// Under the hood, this uses LMS_SHA256_M32_H5 for fast keygen in test environments.
func GenerateLMSKeyPair() (pubBytes []byte, privBytes []byte, err error) {
	// LMS_SHA256_M32_H5 height 5 (32 OTS keys per private key) for fast test runs
	seckey, err := lms.NewPrivateKey(common.LMS_SHA256_M32_H5, common.LMOTS_SHA256_N32_W4)
	if err != nil {
		return nil, nil, err
	}

	pub := seckey.Public()
	pubBytes = pub.ToBytes()
	privBytes = seckey.ToBytes()

	return pubBytes, privBytes, nil
}

// SignLMS generates an LMS signature on a message.
// IMPORTANT: LMS is stateful. Repeatedly using the same privBytes will violate LMS safety.
// This function returns the updated private key bytes and the signature.
func SignLMS(privBytes []byte, msg []byte) (updatedPrivBytes []byte, sig []byte, err error) {
	seckey, err := lms.LmsPrivateKeyFromBytes(privBytes)
	if err != nil {
		return nil, nil, err
	}

	signature, err := seckey.Sign(msg, nil)
	if err != nil {
		return nil, nil, err
	}

	sigBytes, err := signature.ToBytes()
	if err != nil {
		return nil, nil, err
	}

	// Marshal updated state
	updatedPrivBytes = seckey.ToBytes()

	return updatedPrivBytes, sigBytes, nil
}

// VerifyLMS verifies an LMS signature on a message.
func VerifyLMS(pubBytes []byte, msg []byte, signature []byte) (bool, error) {
	pub, err := lms.LmsPublicKeyFromBytes(pubBytes)
	if err != nil {
		return false, err
	}

	sig, err := lms.LmsSignatureFromBytes(signature)
	if err != nil {
		return false, err
	}

	valid := pub.Verify(msg, sig)
	if !valid {
		return false, errors.New("invalid LMS signature")
	}

	return true, nil
}
