package manager

import (
	"net/mail"
	"strings"

	pb "github.com/coreos-inc/soy/proto"
)

func ValidEmail(email string) bool {
	address, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}

	// For our purporses require a TLD in the address.
	parts := strings.Split(address.Address, "@")
	if len(parts) != 2 {
		return false
	}
	if !strings.Contains(parts[1], ".") {
		return false
	}

	// Has mail.ParseAddress parsed the entire string and only found a single
	// address without a name?
	return address.Address == email
}

func ValidRole(role string) bool {
	if _, ok := pb.Role_value[role]; ok {
		return true
	}
	return false
}
